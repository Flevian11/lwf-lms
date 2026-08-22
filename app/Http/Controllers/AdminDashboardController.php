<?php

namespace App\Http\Controllers;

use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\Payment;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Administrative overview. This is read-only for now; management
     * actions will be added to their dedicated admin pages incrementally.
     */
    public function __invoke(Request $request): Response
    {
        $admin = $request->user();

        abort_unless($admin !== null && $admin->hasRole('Admin'), 403);

        /*
         * Student accounts are normally assigned the Student role. The existing
         * development database also contains learner records created before the
         * role assignment was consistently applied, so the admin dashboard must
         * not report zero students simply because a legacy learner is missing the
         * role pivot. Treat users with learning enrollments as students as well,
         * while explicitly excluding administrators.
         */
        $studentQuery = User::query()
            ->whereDoesntHave('roles', fn ($query) => $query
                ->where('name', 'Admin')
                ->where('guard_name', 'web')
            )
            ->where(function ($query) {
                $query
                    ->whereHas('roles', fn ($roleQuery) => $roleQuery
                        ->where('name', 'Student')
                        ->where('guard_name', 'web')
                    )
                    ->orWhereHas('courseEnrollments');
            });

        $stats = [
            'students' => [
                'total' => (clone $studentQuery)->count(),
                'active' => (clone $studentQuery)->where('status', 'active')->count(),
            ],
            'courses' => [
                'total' => Course::count(),
                'published' => Course::where('status', 'published')->count(),
                'drafts' => Course::where('status', 'draft')->count(),
            ],
            'lessons' => [
                'published' => Lesson::where('status', 'published')->count(),
            ],
            'enrollments' => [
                'active' => CourseEnrollment::where('status', 'active')->count(),
                'completed' => CourseEnrollment::where('status', 'completed')->count(),
            ],
            'marking' => [
                'pending_assignments' => AssignmentSubmission::whereIn('status', ['submitted', 'late'])->count(),
                'graded_today' => AssignmentSubmission::where('status', 'graded')
                    ->whereDate('graded_at', today())
                    ->count(),
            ],
            'quizzes' => [
                'attempts' => QuizAttempt::count(),
                'submitted' => QuizAttempt::where('status', 'submitted')->count(),
            ],
            'payments' => [
                'successful_count' => Payment::where('status', 'successful')->count(),
                'successful_amount' => (float) Payment::where('status', 'successful')->sum('amount'),
                'currency' => Payment::where('status', 'successful')->value('currency') ?? 'KES',
            ],
        ];

        $recentEnrollments = CourseEnrollment::query()
            ->with(['user:id,name,email', 'course:id,title'])
            ->latest('created_at')
            ->limit(6)
            ->get()
            ->map(fn (CourseEnrollment $enrollment) => [
                'id' => $enrollment->id,
                'student' => $enrollment->user?->name ?? 'Unknown student',
                'email' => $enrollment->user?->email,
                'course' => $enrollment->course?->title ?? 'Unknown course',
                'status' => $enrollment->status,
                'source' => $enrollment->source,
                'created_at' => $enrollment->created_at?->toISOString(),
            ])
            ->values();

        $pendingSubmissions = AssignmentSubmission::query()
            ->with([
                'user:id,name,email',
                'assignment:id,title,course_id',
                'assignment.course:id,title',
            ])
            ->whereIn('status', ['submitted', 'late'])
            ->latest('submitted_at')
            ->limit(6)
            ->get()
            ->map(fn (AssignmentSubmission $submission) => [
                'id' => $submission->id,
                'student' => $submission->user?->name ?? 'Unknown student',
                'assignment' => $submission->assignment?->title ?? 'Unknown assignment',
                'course' => $submission->assignment?->course?->title ?? 'Unknown course',
                'status' => $submission->status,
                'submitted_at' => $submission->submitted_at?->toISOString(),
                'has_file' => $submission->file_path !== null,
            ])
            ->values();

        $recentQuizAttempts = QuizAttempt::query()
            ->with(['user:id,name', 'quiz:id,title'])
            ->latest('created_at')
            ->limit(6)
            ->get()
            ->map(fn (QuizAttempt $attempt) => [
                'id' => $attempt->id,
                'student' => $attempt->user?->name ?? 'Unknown student',
                'quiz' => $attempt->quiz?->title ?? 'Unknown quiz',
                'attempt_number' => $attempt->attempt_number,
                'status' => $attempt->status,
                'percentage' => $attempt->percentage,
                'passed' => $attempt->passed,
                'submitted_at' => $attempt->submitted_at?->toISOString(),
            ])
            ->values();

        $recentPayments = Payment::query()
            ->with(['user:id,name', 'course:id,title'])
            ->latest('created_at')
            ->limit(6)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'student' => $payment->user?->name ?? 'Unknown student',
                'course' => $payment->course?->title ?? 'Unknown course',
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'method' => $payment->payment_method,
                'created_at' => $payment->created_at?->toISOString(),
            ])
            ->values();

        return Inertia::render('Admin/Dashboard', [
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'avatar_path' => $admin->avatar_path,
                'email_two_factor_enabled' => (bool) $admin->email_two_factor_enabled,
            ],
            'stats' => $stats,
            'recentEnrollments' => $recentEnrollments,
            'pendingSubmissions' => $pendingSubmissions,
            'recentQuizAttempts' => $recentQuizAttempts,
            'recentPayments' => $recentPayments,
        ]);
    }
}
