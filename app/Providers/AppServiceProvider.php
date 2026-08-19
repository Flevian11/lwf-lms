<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\TwoFactorChallengeViewResponse;
use Laravel\Fortify\Contracts\TwoFactorDisabledResponse;
use Laravel\Fortify\Contracts\TwoFactorEnabledResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse;
use Laravel\Fortify\Contracts\VerifyEmailViewResponse;
use Laravel\Head\Enums\OgType;
use Laravel\Head\Enums\TwitterCard;
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        /*
         * --------------------------------------------------------------------------
         * Authentication Response Bindings
         * --------------------------------------------------------------------------
         *
         * Normal login:
         *     App\Http\Responses\LoginResponse
         *
         * Email verification:
         *     App\Http\Responses\VerifyEmailResponse
         *
         * Email verification notice:
         *     App\Http\Responses\VerifyEmailViewResponse
         *
         * Passkey login:
         *     App\Http\Responses\PasskeyLoginResponse
         *
         * Two-factor authentication:
         *     App\Http\Responses\TwoFactorChallengeViewResponse
         *     App\Http\Responses\TwoFactorLoginResponse
         *     App\Http\Responses\TwoFactorEnabledResponse
         *     App\Http\Responses\TwoFactorDisabledResponse
         */

        $this->app->singleton(
            LoginResponse::class,
            \App\Http\Responses\LoginResponse::class
        );

        $this->app->singleton(
            VerifyEmailResponse::class,
            \App\Http\Responses\VerifyEmailResponse::class
        );

        $this->app->singleton(
            VerifyEmailViewResponse::class,
            \App\Http\Responses\VerifyEmailViewResponse::class
        );

        $this->app->singleton(
            PasskeyLoginResponse::class,
            \App\Http\Responses\PasskeyLoginResponse::class
        );

        $this->app->singleton(
            TwoFactorChallengeViewResponse::class,
            \App\Http\Responses\TwoFactorChallengeViewResponse::class
        );

        $this->app->singleton(
            TwoFactorLoginResponse::class,
            \App\Http\Responses\TwoFactorLoginResponse::class
        );

        $this->app->singleton(
            TwoFactorEnabledResponse::class,
            \App\Http\Responses\TwoFactorEnabledResponse::class
        );

        $this->app->singleton(
            TwoFactorDisabledResponse::class,
            \App\Http\Responses\TwoFactorDisabledResponse::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        /*
         * --------------------------------------------------------------------------
         * Authentication Rate Limiting
         * --------------------------------------------------------------------------
         */

        RateLimiter::for('login', function (Request $request): Limit {
            $email = mb_strtolower(
                trim((string) $request->input('email'))
            );

            return Limit::perMinute(5)
                ->by($email . '|' . $request->ip());
        });

        /*
         * --------------------------------------------------------------------------
         * Two-Factor Authentication Rate Limiting
         * --------------------------------------------------------------------------
         */

        RateLimiter::for('two-factor', function (Request $request): Limit {
            return Limit::perMinute(5)
                ->by(
                    (string) $request->session()->get('login.id')
                    . '|'
                    . $request->ip()
                );
        });

        /*
         * --------------------------------------------------------------------------
         * Passkey Authentication Rate Limiting
         * --------------------------------------------------------------------------
         */

        RateLimiter::for('passkeys', function (Request $request): Limit {
            return Limit::perMinute(6)
                ->by($request->ip());
        });

        /*
         * --------------------------------------------------------------------------
         * Global SEO Defaults
         * --------------------------------------------------------------------------
         */

        Head::defaults(function (HeadBuilder $head): void {
            $head
                ->title(
                    config('app.name', 'Learn With Flevian LMS'),
                    suffix: ' — Learn With Flevian LMS'
                )
                ->description(
                    'Learn With Flevian is a modern learning, assessment and certification platform.'
                )
                ->canonical(
                    forceHttps: app()->environment('production')
                )
                ->og(
                    siteName: 'Learn With Flevian LMS',
                    type: OgType::Website
                )
                ->twitter(
                    card: TwitterCard::SummaryWithLargeImage
                )
                ->searchableByRobots();
        });

        /*
         * --------------------------------------------------------------------------
         * Stable Browser / PWA Metadata
         * --------------------------------------------------------------------------
         */

        Head::inertiaGlobals(function (HeadBuilder $head): void {
            $head
                ->viewport(
                    'width=device-width, initial-scale=1, viewport-fit=cover'
                )
                ->colorScheme('light')
                ->referrer('strict-origin-when-cross-origin')
                ->applicationName('Learn With Flevian LMS')
                ->appleWebAppTitle('Learn With Flevian')
                ->webAppCapable()
                ->appleWebAppStatusBarStyle('black-translucent')
                ->manifest('/manifest.webmanifest')
                ->themeColor('#0f172a');
        });

        /*
         * --------------------------------------------------------------------------
         * Error Pages
         * --------------------------------------------------------------------------
         *
         * Error pages should never be indexed.
         */

        Head::errors(function ($errors): void {
            $errors->defaults(
                robots: 'noindex, follow'
            );

            $errors->status(
                404,
                title: 'Page Not Found',
                description: 'The requested page could not be found.'
            );

            $errors->status(
                403,
                title: 'Access Denied',
                description: 'You do not have permission to access this page.'
            );

            $errors->status(
                419,
                title: 'Page Expired',
                description: 'This page has expired. Please try again.'
            );

            $errors->status(
                429,
                title: 'Too Many Requests',
                description: 'Too many requests were received. Please try again.'
            );

            $errors->status(
                500,
                title: 'Server Error',
                description: 'An unexpected server error occurred.'
            );

            $errors->status(
                503,
                title: 'Service Unavailable',
                description: 'Learn With Flevian is temporarily unavailable.'
            );
        });
    }
}