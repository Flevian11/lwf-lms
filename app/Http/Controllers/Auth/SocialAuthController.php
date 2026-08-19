<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

            Auth::login($user, remember: true);

            request()->session()->regenerate();

            return redirect()->intended('/');
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
         * An authenticated OAuth provider has supplied the identity used
         * to authenticate this login. When an email address is supplied,
         * treat that provider email as verified in the LMS.
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
         *
         * A provider-authenticated email is treated as verified here,
         * so an existing unverified LMS account becomes verified when
         * the user successfully authenticates through Google or GitHub.
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
             * The existing account has now authenticated through the
             * external provider, so its provider email is considered
             * verified by the LMS.
             */
            $user->forceFill([
                'last_login_at' => now(),
                'email_verified_at' => $providerEmailIsVerified
                    ? ($user->email_verified_at ?? now())
                    : $user->email_verified_at,
            ])->save();
        }

        /*
         * Link the provider identity to the LMS account.
         */
        $this->createSocialAccount(
            $user,
            $provider,
            $socialiteUser
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
}