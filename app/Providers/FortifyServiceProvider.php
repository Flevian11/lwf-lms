<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\RedirectIfEmailTwoFactorAuthenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\CanonicalizeUsername;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        /*
         * Inertia authentication views.
         */
        Fortify::loginView(function () {
            return Inertia::render('Auth/Login', [
                'canResetPassword' => true,
                'canRegister' => true,
                'status' => session('status'),
            ]);
        });

        Fortify::registerView(function () {
            return Inertia::render('Auth/Register', [
                'canLogin' => true,
            ]);
        });

        /*
         * User registration.
         */
        Fortify::createUsersUsing(CreateNewUser::class);

        /*
         * Password authentication pipeline.
         *
         * IMPORTANT:
         *
         * Native Fortify TOTP 2FA is not used.
         *
         * Instead:
         *
         * password
         *    ↓
         * validate credentials
         *    ↓
         * email 2FA enabled?
         *    ↓
         * yes → send email OTP → challenge
         * no  → normal authentication
         *
         * Passkey authentication does NOT pass through this
         * password pipeline, so passkeys remain passwordless
         * and do not trigger email 2FA.
         */
        Fortify::authenticateThrough(function (Request $request) {
            return array_filter([
                config('fortify.limiters.login')
                    ? null
                    : EnsureLoginIsNotThrottled::class,

                config('fortify.lowercase_usernames')
                    ? CanonicalizeUsername::class
                    : null,

                RedirectIfEmailTwoFactorAuthenticatable::class,

                AttemptToAuthenticate::class,

                PrepareAuthenticatedSession::class,
            ]);
        });
    }
}