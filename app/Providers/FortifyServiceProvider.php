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
         * Login.
         */
        Fortify::loginView(function () {
            return Inertia::render('Auth/Login', [
                'canResetPassword' => true,
                'canRegister' => true,
                'status' => session('status'),
            ]);
        });

        /*
         * Registration.
         */
        Fortify::registerView(function () {
            return Inertia::render('Auth/Register', [
                'canLogin' => true,
            ]);
        });

        /*
         * Forgot password.
         *
         * Fortify handles:
         *
         * GET  /forgot-password
         * POST /forgot-password
         *
         * The GET request is rendered through Inertia while
         * Fortify remains responsible for generating and sending
         * the password reset token/email.
         */
        Fortify::requestPasswordResetLinkView(function () {
            return Inertia::render('Auth/ForgotPassword', [
                'status' => session('status'),
            ]);
        });

        /*
         * Reset password.
         *
         * Fortify handles:
         *
         * GET  /reset-password/{token}
         * POST /reset-password
         *
         * The token is passed directly from the signed reset URL
         * into the React page.
         */
        Fortify::resetPasswordView(function (Request $request) {
            return Inertia::render('Auth/ResetPassword', [
                'token' => $request->route('token'),
                'email' => $request->query('email'),
            ]);
        });

        /*
         * User registration.
         */
        Fortify::createUsersUsing(CreateNewUser::class);

        /*
         * Password authentication pipeline.
         *
         * Password login:
         *
         * email + password
         *       ↓
         * validate credentials
         *       ↓
         * email 2FA enabled?
         *       ↓
         * yes → send email OTP → 2FA challenge
         * no  → authenticated session
         *
         * Passkey authentication is independent of this pipeline.
         * A successful passkey login therefore remains passwordless
         * and does not trigger email 2FA.
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