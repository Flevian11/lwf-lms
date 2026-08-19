<?php

namespace App\Http\Controllers;

use App\Models\EmailTwoFactorCode;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmailTwoFactorController extends Controller
{
    /**
     * Show the email OTP challenge.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user()) {
            return redirect()->route('dashboard');
        }

        $user = $this->pendingUser($request);

        if (! $user) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge', [
            'email' => $this->maskEmail($user->email),
            'expires_at' => optional(
                $user->emailTwoFactorCodes()
                    ->whereNull('used_at')
                    ->latest('id')
                    ->first()
            )?->expires_at?->toIso8601String(),
        ]);
    }

    /**
     * Verify the email OTP and complete authentication.
     */
    public function verify(Request $request): RedirectResponse
    {
        $user = $this->pendingUser($request);

        if (! $user) {
            return redirect()
                ->route('login')
                ->withErrors([
                    'code' => 'Your login session has expired. Please sign in again.',
                ]);
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'digits:6',
            ],
        ]);

        $rateLimitKey = 'email-two-factor:verify:'.$user->id.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            throw ValidationException::withMessages([
                'code' => [
                    'Too many verification attempts. Please wait and try again.',
                ],
            ]);
        }

        $otp = $user->emailTwoFactorCodes()
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if (
            ! $otp ||
            $otp->expires_at->isPast()
        ) {
            RateLimiter::increment($rateLimitKey);

            throw ValidationException::withMessages([
                'code' => [
                    'This verification code has expired. Please request a new code.',
                ],
            ]);
        }

        if ($otp->attempts >= 5) {
            throw ValidationException::withMessages([
                'code' => [
                    'This verification code can no longer be used. Please request a new code.',
                ],
            ]);
        }

        $otp->increment('attempts');

        $providedHash = hash(
            'sha256',
            $validated['code']
        );

        if (! hash_equals($otp->code_hash, $providedHash)) {
            RateLimiter::increment($rateLimitKey);

            throw ValidationException::withMessages([
                'code' => [
                    'The verification code is incorrect.',
                ],
            ]);
        }

        /*
         * Consume the OTP before authenticating the session.
         */
        $otp->forceFill([
            'used_at' => now(),
        ])->save();

        /*
         * Remove the pending-login state.
         */
        $remember = $request->session()->pull(
            'login.remember',
            false
        );

        $request->session()->forget('login.id');

        /*
         * Complete authentication.
         */
        Auth::guard('web')->login($user, (bool) $remember);

        $request->session()->regenerate();

        RateLimiter::clear($rateLimitKey);

        return redirect()->intended(
            route('dashboard')
        );
    }

    /**
     * Send another email OTP.
     */
    public function resend(Request $request): RedirectResponse
    {
        $user = $this->pendingUser($request);

        if (! $user) {
            return redirect()->route('login');
        }

        $rateLimitKey = 'email-two-factor:resend:'.$user->id;

        if (! RateLimiter::attempt(
            $rateLimitKey,
            3,
            fn () => null,
            60
        )) {
            throw ValidationException::withMessages([
                'code' => [
                    'Please wait before requesting another code.',
                ],
            ]);
        }

        $user->emailTwoFactorCodes()
            ->whereNull('used_at')
            ->update([
                'used_at' => now(),
            ]);

        $code = (string) random_int(100000, 999999);

        $user->emailTwoFactorCodes()->create([
            'code_hash' => hash('sha256', $code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $user->notify(
            new \App\Notifications\EmailTwoFactorCodeNotification($code)
        );

        return back()->with(
            'status',
            'A new verification code has been sent to your email.'
        );
    }

    /**
     * Enable email 2FA for the authenticated user.
     */
    public function enable(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'two_factor' => [
                    'You must verify your email address before enabling two-factor authentication.',
                ],
            ]);
        }

        $user->forceFill([
            'email_two_factor_enabled' => true,
            'email_two_factor_enabled_at' => now(),
        ])->save();

        return back()->with(
            'status',
            'Email two-factor authentication has been enabled.'
        );
    }

    /**
     * Disable email 2FA for the authenticated user.
     */
    public function disable(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $user->forceFill([
            'email_two_factor_enabled' => false,
            'email_two_factor_enabled_at' => null,
        ])->save();

        $user->emailTwoFactorCodes()
            ->whereNull('used_at')
            ->update([
                'used_at' => now(),
            ]);

        return back()->with(
            'status',
            'Email two-factor authentication has been disabled.'
        );
    }

    /**
     * Retrieve the user stored in the pending login session.
     */
    private function pendingUser(Request $request): ?User
    {
        $id = $request->session()->get('login.id');

        if (! $id) {
            return null;
        }

        $user = User::find($id);

        if (! $user) {
            $request->session()->forget([
                'login.id',
                'login.remember',
            ]);

            return null;
        }

        return $user;
    }

    /**
     * Mask an email address before displaying it.
     */
    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);

        if (strlen($local) <= 2) {
            $maskedLocal = substr($local, 0, 1).'*';
        } else {
            $maskedLocal =
                substr($local, 0, 2).
                str_repeat('*', max(1, strlen($local) - 2));
        }

        return $maskedLocal.'@'.$domain;
    }
}