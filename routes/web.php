<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailTwoFactorController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\SecurityController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Home
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

/*
|--------------------------------------------------------------------------
| Social Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function (): void {
    Route::get('/{provider}', [
        SocialAuthController::class,
        'redirect',
    ])
        ->whereIn('provider', ['google', 'github'])
        ->name('social.redirect');

    Route::get('/{provider}/callback', [
        SocialAuthController::class,
        'callback',
    ])
        ->whereIn('provider', ['google', 'github'])
        ->name('social.callback');
});

/*
|--------------------------------------------------------------------------
| Email Two-Factor Authentication
|--------------------------------------------------------------------------
|
| These routes replace Fortify's native TOTP challenge.
|
| They intentionally use the guest middleware because the user has
| not completed authentication until the email OTP is verified.
|
*/

Route::middleware(['guest'])->group(function (): void {
    Route::get('/two-factor-challenge', [
        EmailTwoFactorController::class,
        'show',
    ])->name('two-factor.login');

    Route::post('/two-factor-challenge', [
        EmailTwoFactorController::class,
        'verify',
    ])->name('two-factor.login.store');

    Route::post('/two-factor-challenge/resend', [
        EmailTwoFactorController::class,
        'resend',
    ])->name('two-factor.resend');
});

/*
|--------------------------------------------------------------------------
| Authenticated Application
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function (): void {

    /*
     * Main authenticated dashboard.
     *
     * Both Students and Admins can access the dashboard.
     */
    Route::get('/dashboard', DashboardController::class)
        ->name('dashboard');

    /*
     * Security settings.
     *
     * Contains:
     * - Email two-factor authentication
     * - Passkey registration
     * - Registered passkey management
     */
    Route::get('/security', SecurityController::class)
        ->name('security');

    /*
     * Student onboarding.
     */
    Route::get('/onboarding', [
        OnboardingController::class,
        'show',
    ])->name('onboarding');

    Route::post('/onboarding/complete', [
        OnboardingController::class,
        'complete',
    ])->name('onboarding.complete');

    /*
     * Email 2FA settings.
     *
     * These replace Fortify's native TOTP enable/disable endpoints.
     */
    Route::post('/user/two-factor-authentication', [
        EmailTwoFactorController::class,
        'enable',
    ])->name('two-factor.enable');

    Route::delete('/user/two-factor-authentication', [
        EmailTwoFactorController::class,
        'disable',
    ])->name('two-factor.disable');
});