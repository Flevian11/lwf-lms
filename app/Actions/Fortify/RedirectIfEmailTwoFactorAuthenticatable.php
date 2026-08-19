<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Notifications\EmailTwoFactorCodeNotification;
use Illuminate\Auth\Events\Failed;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\LoginRateLimiter;

class RedirectIfEmailTwoFactorAuthenticatable
{
    /**
     * The authentication guard.
     */
    public function __construct(
        protected StatefulGuard $guard,
        protected LoginRateLimiter $limiter,
    ) {
    }

    /**
     * Handle the login request.
     *
     * Password credentials are validated here before Laravel
     * creates an authenticated session.
     */
    public function __invoke(Request $request, $next)
    {
        $user = $this->validateCredentials($request);

        /*
         * Email 2FA is optional.
         *
         * Users without it continue through the normal
         * Fortify authentication pipeline.
         */
        if (! $user->hasEmailTwoFactorEnabled()) {
            return $next($request);
        }

        /*
         * The user's email must be verified before it can
         * be used as the second authentication factor.
         */
        if (! $user->hasVerifiedEmail()) {
            return $next($request);
        }

        /*
         * Store the pending login in the session.
         *
         * The user is NOT authenticated yet.
         */
        $request->session()->put([
            'login.id' => $user->getKey(),
            'login.remember' => $request->boolean('remember'),
        ]);

        /*
         * Invalidate any previous unused OTPs.
         */
        $user->emailTwoFactorCodes()
            ->whereNull('used_at')
            ->update([
                'used_at' => now(),
            ]);

        /*
         * Generate a cryptographically secure six-digit OTP.
         */
        $code = (string) random_int(100000, 999999);

        /*
         * Store only the SHA-256 hash.
         */
        $user->emailTwoFactorCodes()->create([
            'code_hash' => hash('sha256', $code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        /*
         * Send the OTP to the verified email address.
         */
        $user->notify(
            new EmailTwoFactorCodeNotification($code)
        );

        /*
         * Tell the frontend that a second factor is required.
         */
        if ($request->wantsJson()) {
            return response()->json([
                'two_factor' => true,
            ]);
        }

        return redirect()->route('two-factor.login');
    }

    /**
     * Validate the supplied email/password credentials without
     * authenticating the session.
     */
    protected function validateCredentials(Request $request): User
    {
        $provider = $this->guard->getProvider();

        $credentials = $request->only(
            Fortify::username(),
            'password'
        );

        /** @var User|null $user */
        $user = $provider->retrieveByCredentials($credentials);

        if (
            ! $user ||
            ! $provider->validateCredentials(
                $user,
                ['password' => $request->input('password')]
            )
        ) {
            event(new Failed(
                $this->guard->name ?? config('fortify.guard'),
                $user,
                [
                    Fortify::username() => $request->input(Fortify::username()),
                    'password' => $request->input('password'),
                ],
            ));

            $this->limiter->increment($request);

            throw ValidationException::withMessages([
                Fortify::username() => [
                    trans('auth.failed'),
                ],
            ]);
        }

        if (
            config('hashing.rehash_on_login', true) &&
            method_exists($provider, 'rehashPasswordIfRequired')
        ) {
            $provider->rehashPasswordIfRequired(
                $user,
                ['password' => $request->input('password')]
            );
        }

        return $user;
    }
}