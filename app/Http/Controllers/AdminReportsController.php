<?php

namespace App\Http\Controllers;

use App\Models\AchievementDefinition;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Payment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentLearningActivity;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use App\Services\AuditReportService;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

use Inertia\Inertia;
use Inertia\Response;

class AdminReportsController extends Controller
{
    public function __construct(
        protected AuditReportService $auditReportService,
        protected AuditLogService $auditLogService,
    ) {
    }

    public function index(Request $request): Response
    {
        $days = $this->days($request);

        return Inertia::render('Admin/Reports', [
            'admin' => $request->user()->only(['id', 'name', 'email', 'avatar_path', 'email_two_factor_enabled']),
            'period' => ['days' => $days],
            'audit' => $this->auditReportService->getOverview($days, 1, 10),
            'learning' => $this->reportData($days),
        ]);
    }

    public function exportPdf(Request $request)
    {
        $days = $this->days($request);
        $audit = $this->auditReportService->getOverview($days, 1, 20);
        $learning = $this->reportData($days);

        $this->auditLogService->resourceEvent(
            'admin_report_exported',
            'admin_report',
            0,
            $request,
            [
                'action' => 'export_admin_report_pdf',
                'metadata' => ['days' => $days],
            ],
        );

        $html = view('admin.reports.pdf', [
            'days' => $days,
            'generatedAt' => now(),
            'learning' => $learning,
            'audit' => $audit,
        ])->render();

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="learn-with-flevian-admin-report-' . $days . '-days.pdf"',
        ]);
    }


    private function periodMetrics(int $days = 30): array
    {
        $from = now()->subDays($days);

        return [
            'students_added' => User::query()->where('created_at', '>=', $from)->whereDoesntHave('roles', fn ($role) => $role->where('name', 'Admin'))->count(),
            'enrollments_added' => CourseEnrollment::query()->where('enrolled_at', '>=', $from)->count(),
            'completions_added' => CourseEnrollment::query()->whereNotNull('completed_at')->where('completed_at', '>=', $from)->count(),
        ];
    }

    private function activityTrend(int $days = 30): array
    {
        $to = now()->endOfDay();
        $from = now()->subDays($days - 1)->startOfDay();

        $enrollments = CourseEnrollment::query()
            ->whereBetween('enrolled_at', [$from, $to])
            ->selectRaw('DATE(enrolled_at) as day')
            ->selectRaw('COUNT(*) as total')
            ->groupByRaw('DATE(enrolled_at)')
            ->pluck('total', 'day');

        $completions = CourseEnrollment::query()
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$from, $to])
            ->selectRaw('DATE(completed_at) as day')
            ->selectRaw('COUNT(*) as total')
            ->groupByRaw('DATE(completed_at)')
            ->pluck('total', 'day');

        $quizAttempts = QuizAttempt::query()
            ->whereBetween('started_at', [$from, $to])
            ->selectRaw('DATE(started_at) as day')
            ->selectRaw('COUNT(*) as total')
            ->groupByRaw('DATE(started_at)')
            ->pluck('total', 'day');

        return collect(range(0, $days - 1))->map(function (int $offset) use ($from, $enrollments, $completions, $quizAttempts) {
            $date = $from->copy()->addDays($offset);
            $key = $date->toDateString();

            return [
                'date' => $key,
                'label' => $date->format('M j'),
                'enrollments' => (int) ($enrollments[$key] ?? 0),
                'completions' => (int) ($completions[$key] ?? 0),
                'quiz_attempts' => (int) ($quizAttempts[$key] ?? 0),
            ];
        })->values()->all();
    }

    private function recentReportActivity(int $days = 30, int $limit = 10): array
    {
        $from = now()->subDays($days);

        return AuditLog::query()
            ->with(['user:id,name'])
            ->where('occurred_at', '>=', $from)
            ->latest('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'event_type' => $log->event_type,
                'action' => $log->action,
                'user' => $log->user?->name,
                'route_name' => $log->route_name,
                'resource_type' => $log->resource_type,
                'resource_id' => $log->resource_id,
                'occurred_at' => optional($log->occurred_at)->format('d M Y, H:i'),
            ])->values()->all();
    }

    private function days(Request $request): int
    {
        return max(1, min($request->integer('days', 30), 365));
    }

    private function reportData(int $days = 30): array
    {
        $studentScope = fn ($query) => $query
            ->whereHas('roles', fn ($role) => $role->where('name', 'Student'))
            ->orWhereHas('courseEnrollments');

        $students = User::query()
            ->where($studentScope)
            ->whereDoesntHave('roles', fn ($role) => $role->where('name', 'Admin'));

        $assignmentStatuses = AssignmentSubmission::query()
            ->select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->mapWithKeys(fn ($row) => [(string) $row->status => (int) $row->total]);

        $quizStatuses = QuizAttempt::query()
            ->select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->mapWithKeys(fn ($row) => [(string) $row->status => (int) $row->total]);

        $paymentStatuses = Payment::query()
            ->select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->mapWithKeys(fn ($row) => [(string) $row->status => (int) $row->total]);

        $enrollmentRows = CourseEnrollment::query()
            ->select('course_id')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN access_granted_at IS NOT NULL THEN 1 ELSE 0 END) as access_granted_count")
            ->groupBy('course_id')
            ->with('course:id,title,thumbnail_path')
            ->orderByDesc('total')
            ->limit(12)
            ->get();

        $courseBreakdown = $enrollmentRows->map(function ($row) {
            $total = (int) $row->total;
            $completed = min((int) $row->completed, $total);
            $accessible = min((int) $row->access_granted_count, $total);
            $activeAccess = max(0, $accessible - $completed);
            $pendingAccess = max(0, $total - $accessible);

            return [
                'course' => $row->course?->title ?? 'Unknown course',
                'thumbnail_path' => $row->course?->thumbnail_path,
                'total' => $total,
                'completed' => $completed,
                'accessible' => $accessible,
                'active_access' => $activeAccess,
                'pending_access' => $pendingAccess,
                'completion_percent' => $total ? round(($completed / $total) * 100, 1) : 0,
                'access_percent' => $total ? round(($accessible / $total) * 100, 1) : 0,
            ];
        })->values();

        $successfulPayments = Payment::query()->where('status', 'successful');

        $progress = LessonProgress::query();

        $achievementLeaderboard = UserAchievement::query()
            ->with('user:id,name,avatar_path')
            ->select('user_id')
            ->selectRaw('COUNT(*) as awards')
            ->selectRaw('COALESCE(SUM(points_awarded), 0) as points')
            ->groupBy('user_id')
            ->orderByDesc('points')
            ->orderByDesc('awards')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'user_id' => (int) $row->user_id,
                'name' => $row->user?->name ?? 'Unknown learner',
                'avatar_path' => $row->user?->avatar_path,
                'awards' => (int) $row->awards,
                'points' => (int) $row->points,
            ])->values()->all();

        $assignmentPerformanceRows = AssignmentSubmission::query()
            ->join('assignments', 'assignment_submissions.assignment_id', '=', 'assignments.id')
            ->where('assignment_submissions.status', 'graded')
            ->whereNotNull('assignment_submissions.score')
            ->select('assignment_submissions.user_id')
            ->selectRaw('COUNT(*) as graded')
            ->selectRaw('ROUND(AVG(CASE WHEN assignments.max_points > 0 THEN (assignment_submissions.score / assignments.max_points) * 100 ELSE 0 END), 1) as average_percent')
            ->groupBy('assignment_submissions.user_id')
            ->orderByDesc('average_percent')
            ->orderByDesc('graded')
            ->limit(5)
            ->get();

        $assignmentUsers = User::query()
            ->whereIn('id', $assignmentPerformanceRows->pluck('user_id')->all())
            ->get(['id', 'name', 'avatar_path'])
            ->keyBy('id');

        $assignmentPerformance = $assignmentPerformanceRows->map(fn ($row) => [
            'user_id' => (int) $row->user_id,
            'name' => $assignmentUsers[(int) $row->user_id]?->name ?? 'Unknown learner',
            'avatar_path' => $assignmentUsers[(int) $row->user_id]?->avatar_path,
            'graded' => (int) $row->graded,
            'average_percent' => (float) $row->average_percent,
        ])->values()->all();

        $quizPerformance = QuizAttempt::query()
            ->with('user:id,name,avatar_path')
            ->whereNotNull('graded_at')
            ->whereNotNull('percentage')
            ->select('user_id')
            ->selectRaw('COUNT(*) as attempts')
            ->selectRaw('SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed')
            ->selectRaw('ROUND(AVG(percentage), 1) as average_percent')
            ->groupBy('user_id')
            ->orderByDesc('average_percent')
            ->orderByDesc('passed')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'user_id' => (int) $row->user_id,
                'name' => $row->user?->name ?? 'Unknown learner',
                'avatar_path' => $row->user?->avatar_path,
                'attempts' => (int) $row->attempts,
                'passed' => (int) $row->passed,
                'average_percent' => (float) $row->average_percent,
            ])->values()->all();

        return [
            'inventory' => [
                'students' => $students->count(),
                'active_students' => (clone $students)->where('status', 'active')->count(),
                'courses' => Course::query()->count(),
                'published_courses' => Course::query()->where('status', 'published')->count(),
                'modules' => CourseModule::query()->count(),
                'lessons' => Lesson::query()->count(),
                'assignments' => Assignment::query()->count(),
                'quizzes' => Quiz::query()->count(),
                'achievement_definitions' => AchievementDefinition::query()->count(),
            ],
            'enrollments' => [
                'total' => CourseEnrollment::query()->count(),
                'pending_access' => CourseEnrollment::query()->whereNull('access_granted_at')->whereNotIn('status', ['completed', 'cancelled'])->count(),
                'with_access' => CourseEnrollment::query()->whereNotNull('access_granted_at')->count(),
                'completed' => CourseEnrollment::query()->where('status', 'completed')->count(),
                'cancelled' => CourseEnrollment::query()->where('status', 'cancelled')->count(),
            ],
            'assignments' => [
                'total' => Assignment::query()->count(),
                'submissions' => AssignmentSubmission::query()->count(),
                'graded' => AssignmentSubmission::query()->where('status', 'graded')->count(),
                'pending' => AssignmentSubmission::query()->whereIn('status', ['submitted', 'late'])->count(),
                'statuses' => $assignmentStatuses->all(),
            ],
            'quizzes' => [
                'total' => Quiz::query()->count(),
                'attempts' => QuizAttempt::query()->count(),
                'submitted' => QuizAttempt::query()->whereNotNull('submitted_at')->count(),
                'passed' => QuizAttempt::query()->where('passed', true)->count(),
                'statuses' => $quizStatuses->all(),
            ],
            'achievements' => [
                'definitions' => AchievementDefinition::query()->count(),
                'awarded' => UserAchievement::query()->count(),
                'points' => (int) UserAchievement::query()->sum('points_awarded'),
            ],
            'engagement' => [
                'lesson_progress_records' => $progress->count(),
                'average_lesson_progress' => round((float) ($progress->avg('progress_percent') ?? 0), 1),
                'learning_activities' => StudentLearningActivity::query()->count(),
            ],
            'finance' => [
                'payments' => Payment::query()->count(),
                'successful_payments' => $successfulPayments->count(),
                'successful_amount' => (float) $successfulPayments->sum('amount'),
                'currency' => Payment::query()->where('status', 'successful')->value('currency') ?? 'KES',
                'statuses' => $paymentStatuses->all(),
            ],
            'course_breakdown' => $courseBreakdown,
            'achievement_leaderboard' => $achievementLeaderboard,
            'assignment_performance' => $assignmentPerformance,
            'quiz_performance' => $quizPerformance,
            'period' => $this->periodMetrics($days),
            'activity_trend' => $this->activityTrend($days),
            'recent_activity' => $this->recentReportActivity($days, 10),
        ];
    }
}
