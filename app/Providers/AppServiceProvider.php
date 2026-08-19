<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Head\Enums\OgType;
use Laravel\Head\Enums\TwitterCard;
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

class AppServiceProvider extends ServiceProvider
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
         * --------------------------------------------------------------------------
         * Authentication Rate Limiting
         * --------------------------------------------------------------------------
         *
         * Limit login attempts by both email address and IP address.
         *
         * This works together with:
         *
         * 'limiters' => [
         *     'login' => 'login',
         * ],
         *
         * in config/fortify.php.
         */
        RateLimiter::for('login', function (Request $request): Limit {
            $email = mb_strtolower(
                trim((string) $request->input('email'))
            );

            return Limit::perMinute(5)
                ->by($email.'|'.$request->ip());
        });

        /*
         * Two-factor authentication rate limiting.
         *
         * Keep this separate from the normal login limiter.
         */
        RateLimiter::for('two-factor', function (Request $request): Limit {
            return Limit::perMinute(5)
                ->by((string) $request->session()->get('login.id').'|'.$request->ip());
        });

        /*
         * Passkey authentication rate limiting.
         */
        RateLimiter::for('passkeys', function (Request $request): Limit {
            return Limit::perMinute(6)
                ->by($request->ip());
        });

        /*
         * Global SEO defaults.
         *
         * Page-specific metadata can override these values later
         * without having to duplicate the global configuration.
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
         * Stable browser / PWA metadata.
         *
         * These are intentionally registered as Inertia globals because
         * they should not be replaced during normal Inertia navigation.
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
                description: 'Too many requests were received. Please try again later.'
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