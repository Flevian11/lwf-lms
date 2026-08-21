<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseEnrollmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailTwoFactorController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizController;
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
| Signed assignment submission downloads
|--------------------------------------------------------------------------
|
| Email confirmation messages use a temporary signed URL so a student can
| download the exact file they submitted without needing a second login.
| The signature is the authorization boundary for this endpoint.
|
*/

Route::get('/assignments/{assignment}/submissions/{submission}/download/email', [
    AssignmentController::class,
    'downloadFromEmail',
])
    ->whereNumber(['assignment', 'submission'])
    ->middleware('signed')
    ->name('assignments.submissions.email-download');

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

Route::middleware(['auth'])->group(function (): void {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard', DashboardController::class)
        ->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Achievements, Academic Transcript & Certificates
    |--------------------------------------------------------------------------
    |
    | Student achievement records are read from the server.
    |
    | Certificates are only downloadable for the authenticated student's
    | own completed course enrollment.
    |
    */

    Route::get('/achievements', [
        AchievementController::class,
        'index',
    ])->name('achievements.index');

    Route::get('/achievements/transcript', [
        AchievementController::class,
        'transcript',
    ])->name('achievements.transcript');

    Route::get('/certificates/{enrollment}/download', [
        CertificateController::class,
        'download',
    ])
        ->whereNumber('enrollment')
        ->name('certificates.download');

    /*
    |--------------------------------------------------------------------------
    | Assignments
    |--------------------------------------------------------------------------
    |
    | Students can only see and submit assignments belonging to courses
    | where they have an active enrollment with granted access.
    |
    */

    Route::get('/assignments', [
        AssignmentController::class,
        'index',
    ])->name('assignments.index');

    Route::get('/assignments/{assignment}', [
        AssignmentController::class,
        'show',
    ])
        ->whereNumber('assignment')
        ->name('assignments.show');

    Route::post('/assignments/{assignment}/submit', [
        AssignmentController::class,
        'submit',
    ])
        ->whereNumber('assignment')
        ->name('assignments.submit');

    Route::get('/assignments/{assignment}/submissions/{submission}/download', [
        AssignmentController::class,
        'download',
    ])
        ->whereNumber(['assignment', 'submission'])
        ->name('assignments.submissions.download');

    Route::get('/assignments/{assignment}/submissions/{submission}/transcript', [
        AssignmentController::class,
        'transcript',
    ])
        ->whereNumber(['assignment', 'submission'])
        ->name('assignments.submissions.transcript');

    /*
    |--------------------------------------------------------------------------
    | Quizzes
    |--------------------------------------------------------------------------
    |
    | Quiz attempts are server-authoritative. The browser is responsible for
    | presenting the secure attempt interface and reporting observable
    | security events; scoring, expiry and violation counting happen on the
    | server.
    |
    */

    Route::get('/quizzes', [
        QuizController::class,
        'index',
    ])->name('quizzes.index');

    Route::get('/quizzes/{quiz}', [
        QuizController::class,
        'show',
    ])
        ->whereNumber('quiz')
        ->name('quizzes.show');

    Route::post('/quizzes/{quiz}/start', [
        QuizController::class,
        'start',
    ])
        ->whereNumber('quiz')
        ->name('quizzes.start');

    Route::get('/quizzes/{quiz}/attempts/{attempt}', [
        QuizController::class,
        'attempt',
    ])
        ->whereNumber(['quiz', 'attempt'])
        ->name('quizzes.attempt');

    Route::post('/quizzes/{quiz}/attempts/{attempt}/answers', [
        QuizController::class,
        'saveAnswers',
    ])
        ->whereNumber(['quiz', 'attempt'])
        ->name('quizzes.attempts.answers');

    Route::post('/quizzes/{quiz}/attempts/{attempt}/heartbeat', [
        QuizController::class,
        'heartbeat',
    ])
        ->whereNumber(['quiz', 'attempt'])
        ->name('quizzes.attempts.heartbeat');

    Route::post('/quizzes/{quiz}/attempts/{attempt}/violation', [
        QuizController::class,
        'violation',
    ])
        ->whereNumber(['quiz', 'attempt'])
        ->name('quizzes.attempts.violation');

    Route::post('/quizzes/{quiz}/attempts/{attempt}/submit', [
        QuizController::class,
        'submit',
    ])
        ->whereNumber(['quiz', 'attempt'])
        ->name('quizzes.attempts.submit');

    Route::get('/quizzes/{quiz}/attempts/{attempt}/result', [
        QuizController::class,
        'result',
    ])
        ->whereNumber(['quiz', 'attempt'])
        ->name('quizzes.result');

    /*
    |--------------------------------------------------------------------------
    | Student Support
    |--------------------------------------------------------------------------
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
    | Profile
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
    | Security
    |--------------------------------------------------------------------------
    */

    Route::get('/security', SecurityController::class)
        ->name('security');

    /*
    |--------------------------------------------------------------------------
    | Course Catalogue
    |--------------------------------------------------------------------------
    |
    | Shows all published courses.
    |
    | Payment status does NOT hide courses from the catalogue.
    |
    */

    Route::get('/courses', StudentCoursesController::class)
        ->name('courses');

    /*
    |--------------------------------------------------------------------------
    | Protected Course Learning
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This route comes BEFORE /courses/{slug}.
    |
    | CourseController::learn() performs the server-side access check.
    |
    */

    Route::post('/courses/{slug}/enroll', [
        CourseEnrollmentController::class,
        'store',
    ])->name('courses.enroll');

    Route::get('/courses/{slug}/learn', [
        CourseController::class,
        'learn',
    ])->name('courses.learn');

    /*
    |--------------------------------------------------------------------------
    | Course Overview
    |--------------------------------------------------------------------------
    |
    | Safe course information / overview endpoint.
    |
    | The frontend preview now uses catalogue data directly, but this
    | endpoint remains useful for direct course overview pages.
    |
    */

    Route::get('/courses/{slug}', [
        CourseController::class,
        'show',
    ])->name('courses.show');

    /*
    |--------------------------------------------------------------------------
    | Session / Device Security
    |--------------------------------------------------------------------------
    */

    Route::delete('/security/sessions/{sessionId}', [
        UserSessionController::class,
        'destroy',
    ])->name('security.sessions.destroy');

    Route::post('/security/sessions/revoke-others', [
        UserSessionController::class,
        'destroyOthers',
    ])->name('security.sessions.revoke-others');

    /*
    |--------------------------------------------------------------------------
    | Onboarding
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