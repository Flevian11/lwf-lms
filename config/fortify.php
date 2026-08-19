<?php

use Laravel\Fortify\Features;

return [

    /*
    |--------------------------------------------------------------------------
    | Fortify Guard
    |--------------------------------------------------------------------------
    */

    'guard' => 'web',

    /*
    |--------------------------------------------------------------------------
    | Fortify Password Broker
    |--------------------------------------------------------------------------
    */

    'passwords' => 'users',

    /*
    |--------------------------------------------------------------------------
    | Username / Email
    |--------------------------------------------------------------------------
    */

    'username' => 'email',

    'email' => 'email',

    /*
    |--------------------------------------------------------------------------
    | Lowercase Usernames
    |--------------------------------------------------------------------------
    */

    'lowercase_usernames' => true,

    /*
    |--------------------------------------------------------------------------
    | Home Path
    |--------------------------------------------------------------------------
    |
    | This will be handled by our application authentication flow so that
    | Admin and Student users can be directed to their appropriate area.
    |
    */

    'home' => '/',

    /*
    |--------------------------------------------------------------------------
    | Fortify Routes Prefix / Subdomain
    |--------------------------------------------------------------------------
    */

    'prefix' => '',

    'domain' => null,

    /*
    |--------------------------------------------------------------------------
    | Fortify Routes Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Login and passkey operations remain protected by Fortify's limiters.
    | Two-factor authentication has its own independent limiter.
    |
    */

    'limiters' => [
        'login' => 'login',
        'two-factor' => 'two-factor',
        'passkeys' => 'passkeys',
    ],

    /*
    |--------------------------------------------------------------------------
    | Register View Routes
    |--------------------------------------------------------------------------
    |
    | We are using Inertia + React/TSX for the actual authentication UI.
    |
    */

    'views' => true,

    /*
    |--------------------------------------------------------------------------
    | Passkeys
    |--------------------------------------------------------------------------
    |
    | WebAuthn/passkeys are enabled for passwordless authentication.
    |
    */

    'passkeys' => [
        'relying_party_id' => parse_url(
            config('app.url'),
            PHP_URL_HOST
        ),

        'allowed_origins' => [
            config('app.url'),
        ],

        'timeout' => 60000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Features
    |--------------------------------------------------------------------------
    |
    | Authentication capabilities enabled for the LMS.
    |
    | 2FA is OPTIONAL:
    |
    | - User without 2FA enabled:
    |       Email/password → authenticated session
    |
    | - User with 2FA enabled:
    |       Email/password → 2FA challenge → authenticated session
    |
    | Fortify determines whether the second factor is required based on
    | the user's actual two-factor configuration.
    |
    */

    'features' => [

        /*
         * User registration.
         */
        Features::registration(),

        /*
         * Password reset.
         */
        Features::resetPasswords(),

        /*
         * Verified email addresses.
         */
        Features::emailVerification(),

        /*
         * Profile updates.
         */
        Features::updateProfileInformation(),

        /*
         * Password changes.
         */
        Features::updatePasswords(),

        /*
         * Optional two-factor authentication.
         *
         * Users may enable 2FA from their account security settings.
         *
         * Once enabled, Fortify requires the second factor during
         * authentication.
         */
        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]),

        /*
         * Passkey/WebAuthn authentication.
         *
         * Users can register passkeys after authentication and use
         * them for subsequent passwordless authentication.
         */
        Features::passkeys([
            'confirmPassword' => true,
        ]),
    ],

];