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
    */

    'views' => true,

    /*
    |--------------------------------------------------------------------------
    | Passkeys
    |--------------------------------------------------------------------------
    |
    | Passkeys remain completely independent from email 2FA.
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
    | IMPORTANT:
    |
    | Native Fortify two-factor authentication is intentionally NOT enabled.
    | Fortify's native implementation is TOTP/authenticator-app based.
    |
    | Learn With Flevian uses its own email OTP implementation instead.
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
         * Native Fortify two-factor authentication is deliberately absent.
         *
         * Email OTP is implemented by the application.
         */

        /*
         * Passkey/WebAuthn authentication.
         *
         * Passkeys are passwordless and bypass email 2FA.
         */
        Features::passkeys([
            'confirmPassword' => false,
        ]),
    ],

];