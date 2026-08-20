<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailTwoFactorController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\StudentCoursesController;
use App\Http\Controllers\UserSessionController;
use App\Services\StudentDashboardService;
use Illuminate\Http\Request;
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
| Password Reset
|--------------------------------------------------------------------------
*/

Route::get('/reset-password', function () {
    return redirect()->route('password.request');
})->name('password.reset.start');

/*
|--------------------------------------------------------------------------
| Email Two-Factor Authentication Challenge
|--------------------------------------------------------------------------
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
    |--------------------------------------------------------------------------
    | Main Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard', DashboardController::class)
        ->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Student Support
    |--------------------------------------------------------------------------
    |
    | Support uses the same student/stats contract as the dashboard.
    |
    */

    Route::get('/support', function (
        Request $request,
        StudentDashboardService $studentDashboardService,
    ) {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $dashboard = $studentDashboardService
            ->getDashboardData($user);

        return Inertia::render('Support', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
        ]);
    })->name('support');

    /*
    |--------------------------------------------------------------------------
    | Student Profile
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', [
        ProfileController::class,
        'show',
    ])->name('profile');

    Route::post('/profile', [
        ProfileController::class,
        'update',
    ])->name('profile.update');

    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    */

    Route::get('/security', SecurityController::class)
        ->name('security');

    /*
    |--------------------------------------------------------------------------
    | Student Course Catalogue
    |--------------------------------------------------------------------------
    |
    | This page shows the complete published course catalogue.
    |
    | IMPORTANT:
    | A student who has not paid for a paid course must STILL be able
    | to see that course in the catalogue.
    |
    | Payment/access restrictions are enforced when opening the course
    | and attempting to access protected learning content.
    |
    */

    Route::get('/courses', StudentCoursesController::class)
        ->name('courses');

    /*
    |--------------------------------------------------------------------------
    | Individual Course
    |--------------------------------------------------------------------------
    |
    | This is the course detail / preview / learning page.
    |
    | CourseController determines the effective access level:
    |
    |   free
    |       Full access.
    |
    |   full
    |       Paid course with payment or administrative approval.
    |
    |   preview
    |       Course information and explicitly configured preview content.
    |
    | The frontend does NOT decide authorization.
    |
    */

    Route::get('/courses/{slug}', [
        CourseController::class,
        'show',
    ])->name('courses.show');

    /*
    |--------------------------------------------------------------------------
    | Individual Authenticated Session / Device Revocation
    |--------------------------------------------------------------------------
    */

    Route::delete('/security/sessions/{sessionId}', [
        UserSessionController::class,
        'destroy',
    ])->name('security.sessions.destroy');

    /*
    |--------------------------------------------------------------------------
    | Revoke All Other Sessions
    |--------------------------------------------------------------------------
    |
    | Preserves the current device/session.
    |
    */

    Route::post('/security/sessions/revoke-others', [
        UserSessionController::class,
        'destroyOthers',
    ])->name('security.sessions.revoke-others');

    /*
    |--------------------------------------------------------------------------
    | Student Onboarding
    |--------------------------------------------------------------------------
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
    |--------------------------------------------------------------------------
    | Email Two-Factor Authentication Settings
    |--------------------------------------------------------------------------
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