<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\StudentChatbotController;
use App\Http\Controllers\StudentSearchController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseEnrollmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminCourseController;
use App\Http\Controllers\AdminModuleLessonController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminSecurityController;
use App\Http\Controllers\AdminAchievementController;
use App\Http\Controllers\AdminStudentController;
use App\Http\Controllers\AdminEnrollmentController;
use App\Http\Controllers\AdminAssignmentController;
use App\Http\Controllers\AdminQuizController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Controllers\EmailTwoFactorController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicHomeController;
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

Route::get('/', PublicHomeController::class)->name('home');

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

Route::middleware(['auth', AdminMiddleware::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function (): void {
        Route::get('/', AdminDashboardController::class)
            ->name('dashboard');

        Route::get('/courses', [AdminCourseController::class, 'index'])
            ->name('courses.index');

        Route::post('/courses', [AdminCourseController::class, 'store'])
            ->name('courses.store');

        Route::put('/courses/{course}', [AdminCourseController::class, 'update'])
            ->whereNumber('course')
            ->name('courses.update');

        Route::delete('/courses/{course}', [AdminCourseController::class, 'destroy'])
            ->whereNumber('course')
            ->name('courses.destroy');

        Route::get('/modules-lessons', [AdminModuleLessonController::class, 'index'])
            ->name('modules-lessons.index');

        Route::post('/modules-lessons/modules', [AdminModuleLessonController::class, 'storeModule'])
            ->name('modules-lessons.modules.store');

        Route::put('/modules-lessons/modules/{module}', [AdminModuleLessonController::class, 'updateModule'])
            ->whereNumber('module')
            ->name('modules-lessons.modules.update');

        Route::delete('/modules-lessons/modules/{module}', [AdminModuleLessonController::class, 'destroyModule'])
            ->whereNumber('module')
            ->name('modules-lessons.modules.destroy');

        Route::post('/modules-lessons/modules/{module}/move', [AdminModuleLessonController::class, 'moveModule'])
            ->whereNumber('module')
            ->name('modules-lessons.modules.move');

        Route::post('/modules-lessons/lessons', [AdminModuleLessonController::class, 'storeLesson'])
            ->name('modules-lessons.lessons.store');

        Route::put('/modules-lessons/lessons/{lesson}', [AdminModuleLessonController::class, 'updateLesson'])
            ->whereNumber('lesson')
            ->name('modules-lessons.lessons.update');

        Route::delete('/modules-lessons/lessons/{lesson}', [AdminModuleLessonController::class, 'destroyLesson'])
            ->whereNumber('lesson')
            ->name('modules-lessons.lessons.destroy');

        Route::post('/modules-lessons/lessons/{lesson}/move', [AdminModuleLessonController::class, 'moveLesson'])
            ->whereNumber('lesson')
            ->name('modules-lessons.lessons.move');

        Route::get('/assignments', [AdminAssignmentController::class, 'index'])->name('assignments.index');
        Route::post('/assignments', [AdminAssignmentController::class, 'store'])->name('assignments.store');
        Route::put('/assignments/{assignment}', [AdminAssignmentController::class, 'update'])->whereNumber('assignment')->name('assignments.update');
        Route::delete('/assignments/{assignment}', [AdminAssignmentController::class, 'destroy'])->whereNumber('assignment')->name('assignments.destroy');
        Route::post('/assignments/{assignment}/allocate', [AdminAssignmentController::class, 'allocate'])->whereNumber('assignment')->name('assignments.allocate');
        Route::post('/assignment-submissions/{submission}/grade', [AdminAssignmentController::class, 'grade'])->whereNumber('submission')->name('assignment-submissions.grade');
        Route::get('/assignment-submissions/{submission}/download', [AdminAssignmentController::class, 'download'])->whereNumber('submission')->name('assignment-submissions.download');

        Route::get('/quizzes', [AdminQuizController::class, 'index'])->name('quizzes.index');
        Route::post('/quizzes', [AdminQuizController::class, 'store'])->name('quizzes.store');
        Route::put('/quizzes/{quiz}', [AdminQuizController::class, 'update'])->whereNumber('quiz')->name('quizzes.update');
        Route::delete('/quizzes/{quiz}', [AdminQuizController::class, 'destroy'])->whereNumber('quiz')->name('quizzes.destroy');
        Route::post('/quizzes/{quiz}/allocate', [AdminQuizController::class, 'allocate'])->whereNumber('quiz')->name('quizzes.allocate');
        Route::post('/quizzes/{quiz}/questions', [AdminQuizController::class, 'storeQuestion'])->whereNumber('quiz')->name('quizzes.questions.store');
        Route::put('/quiz-questions/{question}', [AdminQuizController::class, 'updateQuestion'])->whereNumber('question')->name('quiz-questions.update');
        Route::delete('/quiz-questions/{question}', [AdminQuizController::class, 'destroyQuestion'])->whereNumber('question')->name('quiz-questions.destroy');

        Route::get('/achievements', [AdminAchievementController::class, 'index'])->name('achievements.index');
        Route::post('/achievements', [AdminAchievementController::class, 'store'])->name('achievements.store');
        Route::put('/achievements/{achievement}', [AdminAchievementController::class, 'update'])->whereNumber('achievement')->name('achievements.update');
        Route::delete('/achievements/{achievement}', [AdminAchievementController::class, 'destroy'])->whereNumber('achievement')->name('achievements.destroy');
        Route::post('/achievements/{achievement}/award', [AdminAchievementController::class, 'award'])->whereNumber('achievement')->name('achievements.award');

        Route::get('/students', [AdminStudentController::class, 'index'])->name('students.index');
        Route::post('/students', [AdminStudentController::class, 'store'])->name('students.store');
        Route::put('/students/{student}', [AdminStudentController::class, 'update'])->whereNumber('student')->name('students.update');
        Route::post('/students/{student}/toggle-status', [AdminStudentController::class, 'toggleStatus'])->whereNumber('student')->name('students.toggle-status');
        Route::delete('/students/{student}', [AdminStudentController::class, 'destroy'])->whereNumber('student')->name('students.destroy');

        Route::get('/enrollments', [AdminEnrollmentController::class, 'index'])->name('enrollments.index');
        Route::post('/enrollments/{enrollment}/approve', [AdminEnrollmentController::class, 'approve'])->whereNumber('enrollment')->name('enrollments.approve');
        Route::post('/enrollments/{enrollment}/grant-access', [AdminEnrollmentController::class, 'grantAccess'])->whereNumber('enrollment')->name('enrollments.grant-access');
        Route::post('/enrollments/{enrollment}/suspend', [AdminEnrollmentController::class, 'suspend'])->whereNumber('enrollment')->name('enrollments.suspend');
        Route::post('/enrollments/{enrollment}/cancel', [AdminEnrollmentController::class, 'cancel'])->whereNumber('enrollment')->name('enrollments.cancel');

        Route::get('/achievements', [AdminAchievementController::class, 'index'])->name('achievements.index');
        Route::post('/achievements', [AdminAchievementController::class, 'store'])->name('achievements.store');
        Route::put('/achievements/{achievement}', [AdminAchievementController::class, 'update'])->whereNumber('achievement')->name('achievements.update');
        Route::delete('/achievements/{achievement}', [AdminAchievementController::class, 'destroy'])->whereNumber('achievement')->name('achievements.destroy');
        Route::post('/achievements/{achievement}/award', [AdminAchievementController::class, 'award'])->whereNumber('achievement')->name('achievements.award');

        Route::get('/students', [AdminStudentController::class, 'index'])->name('students.index');
        Route::post('/students', [AdminStudentController::class, 'store'])->name('students.store');
        Route::put('/students/{student}', [AdminStudentController::class, 'update'])->whereNumber('student')->name('students.update');
        Route::post('/students/{student}/toggle-status', [AdminStudentController::class, 'toggleStatus'])->whereNumber('student')->name('students.toggle-status');
        Route::delete('/students/{student}', [AdminStudentController::class, 'destroy'])->whereNumber('student')->name('students.destroy');

        Route::get('/enrollments', [AdminEnrollmentController::class, 'index'])->name('enrollments.index');
        Route::post('/enrollments/{enrollment}/approve', [AdminEnrollmentController::class, 'approve'])->whereNumber('enrollment')->name('enrollments.approve');
        Route::post('/enrollments/{enrollment}/grant-access', [AdminEnrollmentController::class, 'grantAccess'])->whereNumber('enrollment')->name('enrollments.grant-access');
        Route::post('/enrollments/{enrollment}/suspend', [AdminEnrollmentController::class, 'suspend'])->whereNumber('enrollment')->name('enrollments.suspend');
        Route::post('/enrollments/{enrollment}/cancel', [AdminEnrollmentController::class, 'cancel'])->whereNumber('enrollment')->name('enrollments.cancel');

        Route::get('/profile', [
            AdminProfileController::class,
            'show',
        ])->name('profile');

        Route::post('/profile', [
            AdminProfileController::class,
            'update',
        ])->name('profile.update');

        Route::post('/profile/verify-email', [
            AdminProfileController::class,
            'sendVerification',
        ])->name('profile.verify-email');

        Route::get('/settings', AdminSettingsController::class)
            ->name('settings');

        Route::delete('/settings/audit-logs', [
            AdminSettingsController::class,
            'clearAuditLogs',
        ])->name('settings.audit.clear');

        Route::get('/security', AdminSecurityController::class)
            ->name('security');

        Route::post('/security/two-factor', [
            AdminSecurityController::class,
            'enableTwoFactor',
        ])->name('security.two-factor.enable');

        Route::delete('/security/two-factor', [
            AdminSecurityController::class,
            'disableTwoFactor',
        ])->name('security.two-factor.disable');
    });

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
    | TechGhost AI Learning Assistant
    |--------------------------------------------------------------------------
    */

    Route::get('/chatbot', [
        StudentChatbotController::class,
        'page',
    ])->name('chatbot');

    Route::get('/student/search', StudentSearchController::class)
        ->middleware('throttle:60,1')
        ->name('student.search');

    Route::post('/chatbot/message', [
        StudentChatbotController::class,
        'message',
    ])
        ->middleware('throttle:30,1')
        ->name('chatbot.message');

    Route::get('/chatbot/conversations', [
        StudentChatbotController::class,
        'conversations',
    ])->name('chatbot.conversations');

    Route::post('/chatbot/conversations', [
        StudentChatbotController::class,
        'storeConversation',
    ])->name('chatbot.conversations.store');

    Route::get('/chatbot/conversations/{conversation}', [
        StudentChatbotController::class,
        'showConversation',
    ])->name('chatbot.conversations.show');

    Route::patch('/chatbot/conversations/{conversation}', [
        StudentChatbotController::class,
        'renameConversation',
    ])->name('chatbot.conversations.rename');

    Route::delete('/chatbot/conversations/{conversation}', [
        StudentChatbotController::class,
        'destroyConversation',
    ])->name('chatbot.conversations.destroy');

    Route::delete('/chatbot/conversations/{conversation}/messages/{message}', [
        StudentChatbotController::class,
        'destroyMessage',
    ])->whereNumber(['conversation', 'message'])->name('chatbot.messages.destroy');


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