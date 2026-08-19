<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use App\Support\AuthenticatedUserRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class SocialAuthController extends Controller
{
    /**
     * Supported OAuth providers.
     *
     * @var array<int, string>
     */
    private const PROVIDERS = [
        'google',
        'github',
    ];

    /**
     * Redirect the user to the selected OAuth provider.
     */
    public function redirect(string $provider): RedirectResponse
    {
        abort_unless(
            in_array($provider, self::PROVIDERS, true),
            404
        );

        return Socialite::driver($provider)->redirect();
    }

    /**
     * Handle the OAuth provider callback.
     */
    public function callback(string $provider): RedirectResponse
    {
        abort_unless(
            in_array($provider, self::PROVIDERS, true),
            404
        );

        try {
            $socialiteUser = Socialite::driver($provider)->user();

            $user = DB::transaction(function () use (
                $provider,
                $socialiteUser
            ): User {
                return $this->resolveUser(
                    $provider,
                    $socialiteUser
                );
            });

            /*
             * Authenticate the resolved LMS account.
             */
            Auth::login($user, remember: true);

            request()->session()->regenerate();

            /*
             * All authenticated users now use the same destination rules:
             *
             * Admin → /dashboard
             * Student without onboarding → /onboarding
             * Completed Student → /dashboard
             */
            return AuthenticatedUserRedirect::to($user);
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('login')
                ->withErrors([
                    'social' => 'Unable to sign in with this provider. Please try again.',
                ]);
        }
    }

    /**
     * Resolve the LMS user associated with the external account.
     */
    protected function resolveUser(
        string $provider,
        SocialiteUser $socialiteUser
    ): User {
        $providerId = (string) $socialiteUser->getId();
        $providerEmail = $socialiteUser->getEmail();

        /*
         * An OAuth provider has authenticated this identity.
         *
         * When a valid email is supplied, treat it as verified.
         */
        $providerEmailIsVerified = $providerEmail !== null
            && filter_var($providerEmail, FILTER_VALIDATE_EMAIL) !== false;

        /*
         * First resolve an already-linked social account.
         */
        $socialAccount = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        if ($socialAccount) {
            $user = $socialAccount->user;

            $this->updateSocialAccount(
                $socialAccount,
                $socialiteUser
            );

            $this->syncProviderAvatar(
                $user,
                $socialiteUser->getAvatar()
            );

            $user->forceFill([
                'last_login_at' => now(),
            ]);

            if (
                $providerEmailIsVerified
                && $user->email === $providerEmail
                && $user->email_verified_at === null
            ) {
                $user->email_verified_at = now();
            }

            $user->save();

            return $user;
        }

        /*
         * If the provider supplied an email address, first look for an
         * existing LMS account using that email.
         */
        $user = null;

        if ($providerEmailIsVerified) {
            $user = User::query()
                ->where('email', $providerEmail)
                ->first();
        }

        /*
         * Create a new LMS account when no matching account exists.
         */
        if (! $user) {
            $user = User::query()->create([
                'name' => $socialiteUser->getName()
                    ?: $socialiteUser->getNickname()
                    ?: $providerEmail
                    ?: 'LWF Learner',

                'email' => $providerEmail
                    ?: "{$providerId}@{$provider}.lwf.local",

                'password' => Str::random(64),

                'status' => UserStatus::ACTIVE,

                'email_verified_at' => $providerEmailIsVerified
                    ? now()
                    : null,

                'last_login_at' => now(),
            ]);
        } else {
            /*
             * Existing LMS account authenticated through OAuth.
             */
            $user->forceFill([
                'last_login_at' => now(),
                'email_verified_at' => $providerEmailIsVerified
                    ? ($user->email_verified_at ?? now())
                    : $user->email_verified_at,
            ])->save();
        }

        /*
         * Save the provider identity.
         */
        $socialAccount = $this->createSocialAccount(
            $user,
            $provider,
            $socialiteUser
        );

        /*
         * Download the provider avatar to our own server.
         */
        $this->syncProviderAvatar(
            $user,
            $socialiteUser->getAvatar()
        );

        return $user;
    }

    /**
     * Create the external provider account record.
     */
    protected function createSocialAccount(
        User $user,
        string $provider,
        SocialiteUser $socialiteUser
    ): SocialAccount {
        return $user->socialAccounts()->create([
            'provider' => $provider,
            'provider_id' => (string) $socialiteUser->getId(),
            'provider_email' => $socialiteUser->getEmail(),
            'provider_name' => $socialiteUser->getName()
                ?: $socialiteUser->getNickname(),
            'provider_avatar_url' => $socialiteUser->getAvatar(),
        ]);
    }

    /**
     * Refresh provider metadata for an existing external account.
     */
    protected function updateSocialAccount(
        SocialAccount $socialAccount,
        SocialiteUser $socialiteUser
    ): void {
        $socialAccount->forceFill([
            'provider_email' => $socialiteUser->getEmail(),
            'provider_name' => $socialiteUser->getName()
                ?: $socialiteUser->getNickname(),
            'provider_avatar_url' => $socialiteUser->getAvatar(),
        ])->save();
    }

    /**
     * Download and persist a provider avatar locally.
     */
    protected function syncProviderAvatar(
        User $user,
        ?string $avatarUrl
    ): void {
        if (! $avatarUrl || ! filter_var($avatarUrl, FILTER_VALIDATE_URL)) {
            return;
        }

        try {
            $disk = Storage::disk('public');

            /*
             * If the current provider avatar is already stored locally,
             * don't download it again unless we have a reason to refresh it.
             */
            if ($user->avatar_path && $disk->exists($user->avatar_path)) {
                return;
            }

            $response = Http::timeout(10)
                ->connectTimeout(5)
                ->accept('image/*')
                ->get($avatarUrl);

            if (! $response->successful()) {
                return;
            }

            $contentType = strtolower(
                (string) $response->header('Content-Type')
            );

            if (! str_starts_with($contentType, 'image/')) {
                return;
            }

            $extension = match (true) {
                str_contains($contentType, 'png') => 'png',
                str_contains($contentType, 'webp') => 'webp',
                str_contains($contentType, 'gif') => 'gif',
                default => 'jpg',
            };

            $path = 'avatars/users/'
                . $user->id
                . '-'
                . Str::uuid()
                . '.'
                . $extension;

            $disk->put(
                $path,
                $response->body()
            );

            /*
             * Remove the previous local avatar after the new one
             * has successfully been stored.
             */
            if (
                $user->avatar_path
                && $disk->exists($user->avatar_path)
            ) {
                $disk->delete($user->avatar_path);
            }

            $user->forceFill([
                'avatar_path' => $path,
            ])->save();
        } catch (Throwable $exception) {
            /*
             * Avatar download failure must never prevent authentication.
             */
            report($exception);
        }
    }
}