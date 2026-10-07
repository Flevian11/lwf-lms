<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\StudentLearningActivity;
use App\Notifications\CourseCompletedNotification;
use App\Services\AuditLogService;
use App\Support\SendsNotificationsSafely;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminProgressController extends Controller
{
    use SendsNotificationsSafely;

    public function __construct(protected AuditLogService $auditLogService) {}

    /**
     * Progress dashboard: list of enrollments + optional detail panel.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $courseId = (int) $request->integer('course_id');
        $selectedId = (int) $request->integer('enrollment');

        $base = CourseEnrollment::query()
            ->with([
                'user:id,name,email,avatar_path',
                'course:id,title,slug',
            ])
            ->when($search !== '', fn ($q) => $q->where(function ($sq) use ($search) {
                $sq->whereHas('user', fn ($u) => $u
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('course', fn ($c) => $c
                        ->where('title', 'like', "%{$search}%"));
            }))
            ->when(
                in_array($status, ['active', 'completed', 'paused', 'cancelled'], true),
                fn ($q) => $q->where('status', $status)
            )
            ->when($courseId > 0, fn ($q) => $q->where('course_id', $courseId));

        $enrollments = (clone $base)
            ->latest('enrolled_at')
            ->paginate(12, ['*'], 'enrollments_page')
            ->withQueryString()
            ->through(fn (CourseEnrollment $e) => $this->enrollmentSummary($e));

        $selected = null;
        if ($selectedId > 0) {
            $record = CourseEnrollment::with(['user', 'course'])->find($selectedId);
            if ($record) {
                $selected = $this->enrollmentDetail($record);
            }
        }

        return Inertia::render('Admin/Progress', [
            'admin' => $this->adminPayload($request),
            'enrollments' => $enrollments,
            'selected' => $selected,
            'courses' => DB::table('courses')
                ->select('id', 'title')
                ->orderBy('title')
                ->get(),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'course_id' => $courseId,
            ],
            'stats' => [
                'total' => CourseEnrollment::count(),
                'active' => CourseEnrollment::where('status', 'active')->count(),
                'completed' => CourseEnrollment::where('status', 'completed')->count(),
                'paused' => CourseEnrollment::where('status', 'paused')->count(),
            ],
        ]);
    }

    /**
     * Toggle one lesson's completion for the enrollment's student.
     */
    public function toggleLesson(
        Request $request,
        CourseEnrollment $enrollment,
        Lesson $lesson,
    ): RedirectResponse {
        $module = $lesson->module;
        abort_unless($module && $module->course_id === $enrollment->course_id, 404);

        $completed = $request->boolean('completed');

        DB::transaction(function () use ($enrollment, $lesson, $completed) {
            $this->writeLessonProgress($enrollment, $lesson->id, $completed);
            $this->recalculateEnrollment($enrollment);
        });

        $this->auditLogService->resourceEvent(
            $completed ? 'lesson_progress_marked' : 'lesson_progress_unmarked',
            'course_enrollment',
            $enrollment->id,
            $request,
            [
                'action' => 'toggle_lesson_progress',
                'metadata' => [
                    'user_id' => $enrollment->user_id,
                    'course_id' => $enrollment->course_id,
                    'lesson_id' => $lesson->id,
                    'completed' => $completed,
                ],
            ]
        );

        return back();
    }

    /**
     * Bulk-toggle every lesson inside a module.
     */
    public function toggleModule(
        Request $request,
        CourseEnrollment $enrollment,
        CourseModule $module,
    ): RedirectResponse {
        abort_unless($module->course_id === $enrollment->course_id, 404);

        $completed = $request->boolean('completed');

        DB::transaction(function () use ($enrollment, $module, $completed) {
            $lessonIds = $module->lessons()->pluck('id')->all();

            foreach ($lessonIds as $lessonId) {
                $this->writeLessonProgress($enrollment, $lessonId, $completed);
            }

            $this->recalculateEnrollment($enrollment);
        });

        $this->auditLogService->resourceEvent(
            $completed ? 'module_progress_marked' : 'module_progress_unmarked',
            'course_enrollment',
            $enrollment->id,
            $request,
            [
                'action' => 'toggle_module_progress',
                'metadata' => [
                    'user_id' => $enrollment->user_id,
                    'course_id' => $enrollment->course_id,
                    'module_id' => $module->id,
                    'completed' => $completed,
                ],
            ]
        );

        return back();
    }

    /**
     * Wipe every lesson_progress row for this student+course.
     *
     * Also removes the matching StudentLearningActivity rows so the
     * dashboard's weekly chart and streaks revert cleanly.
     */
    public function reset(
        Request $request,
        CourseEnrollment $enrollment,
    ): RedirectResponse {
        DB::transaction(function () use ($enrollment) {
            $lessonIds = $this->courseLessonIds($enrollment->course_id);

            LessonProgress::where('user_id', $enrollment->user_id)
                ->whereIn('lesson_id', $lessonIds)
                ->delete();

            StudentLearningActivity::where('user_id', $enrollment->user_id)
                ->whereIn('lesson_id', $lessonIds)
                ->where('activity_type', 'lesson_completed')
                ->delete();

            $this->recalculateEnrollment($enrollment);
        });

        $this->auditLogService->resourceEvent(
            'progress_reset',
            'course_enrollment',
            $enrollment->id,
            $request,
            [
                'action' => 'reset_progress',
                'metadata' => [
                    'user_id' => $enrollment->user_id,
                    'course_id' => $enrollment->course_id,
                ],
            ]
        );

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Internals
    |--------------------------------------------------------------------------
    */

    /**
     * Write or remove a lesson_progress row AND mirror the change into
     * student_learning_activities so the student dashboard's weekly chart,
     * streaks, and activity feed reflect admin-marked completions.
     */
    private function writeLessonProgress(
        CourseEnrollment $enrollment,
        int $lessonId,
        bool $completed,
    ): void {
        if ($completed) {
            LessonProgress::updateOrCreate(
                [
                    'user_id' => $enrollment->user_id,
                    'lesson_id' => $lessonId,
                ],
                [
                    'status' => 'completed',
                    'progress_percent' => 100,
                    'completed_at' => now(),
                    'started_at' => now(),
                    'last_accessed_at' => now(),
                ]
            );

            // Idempotent: only insert an activity if one doesn't already
            // exist for this user+lesson, so re-marking does not duplicate.
            $exists = StudentLearningActivity::where('user_id', $enrollment->user_id)
                ->where('lesson_id', $lessonId)
                ->where('activity_type', 'lesson_completed')
                ->exists();

            if (! $exists) {
                StudentLearningActivity::create([
                    'user_id' => $enrollment->user_id,
                    'course_id' => $enrollment->course_id,
                    'lesson_id' => $lessonId,
                    'activity_type' => 'lesson_completed',
                    'points' => 0,
                    'occurred_at' => now(),
                ]);
            }

            return;
        }

        LessonProgress::where('user_id', $enrollment->user_id)
            ->where('lesson_id', $lessonId)
            ->delete();

        StudentLearningActivity::where('user_id', $enrollment->user_id)
            ->where('lesson_id', $lessonId)
            ->where('activity_type', 'lesson_completed')
            ->delete();
    }

    /**
     * Mirror CourseController@learn's completion rule.
     *
     * Only touches 'active' <-> 'completed'. Never overrides paused/cancelled.
     */
    private function recalculateEnrollment(CourseEnrollment $enrollment): void
    {
        $stats = $this->progressStats($enrollment);

        if ($stats['total_lessons'] === 0) {
            return;
        }

        $fullyComplete = $stats['completed_lessons'] >= $stats['total_lessons'];

        if ($fullyComplete && $enrollment->status === 'active') {
            $enrollment->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // Notify the student. Mail failure is non-fatal — the enrollment
            // status flip above is already committed.
            $this->safeNotify(
                $enrollment->user,
                new CourseCompletedNotification($enrollment->fresh(['course'])),
                ['context' => 'course_completed', 'enrollment_id' => $enrollment->id],
            );
        } elseif (! $fullyComplete && $enrollment->status === 'completed') {
            $enrollment->update([
                'status' => 'active',
                'completed_at' => null,
            ]);
        }
    }

    /**
     * @return array{completed_lessons:int,total_lessons:int,percent:int}
     */
    private function progressStats(CourseEnrollment $enrollment): array
    {
        $lessonIds = $this->courseLessonIds($enrollment->course_id);

        $totalLessons = Lesson::whereIn('id', $lessonIds)
            ->where('status', 'published')
            ->count();

        $completedLessons = LessonProgress::where('user_id', $enrollment->user_id)
            ->whereIn('lesson_id', $lessonIds)
            ->where('status', 'completed')
            ->count();

        $percent = $totalLessons > 0
            ? (int) round(($completedLessons / $totalLessons) * 100)
            : 0;

        return [
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'percent' => $percent,
        ];
    }

    /**
     * @return array<int,int>
     */
    private function courseLessonIds(int $courseId): array
    {
        $moduleIds = CourseModule::where('course_id', $courseId)->pluck('id');

        return Lesson::whereIn('module_id', $moduleIds)->pluck('id')->all();
    }

    private function enrollmentSummary(CourseEnrollment $e): array
    {
        return [
            'id' => $e->id,
            'status' => $e->status,
            'enrolled_at' => $e->enrolled_at?->toISOString(),
            'completed_at' => $e->completed_at?->toISOString(),
            'user' => [
                'id' => $e->user?->id,
                'name' => $e->user?->name,
                'email' => $e->user?->email,
                'avatar_path' => $e->user?->avatar_path,
            ],
            'course' => [
                'id' => $e->course?->id,
                'title' => $e->course?->title,
                'slug' => $e->course?->slug,
            ],
            'progress' => $this->progressStats($e),
        ];
    }

    private function enrollmentDetail(CourseEnrollment $e): array
    {
        $course = Course::with([
            'modules' => fn ($q) => $q->orderBy('position'),
            'modules.lessons' => fn ($q) => $q
                ->where('status', 'published')
                ->orderBy('position'),
        ])->findOrFail($e->course_id);

        $completedSet = LessonProgress::where('user_id', $e->user_id)
            ->where('status', 'completed')
            ->pluck('lesson_id')
            ->flip();

        $modules = $course->modules->map(function ($module) use ($completedSet) {
            $lessons = $module->lessons->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'type' => $lesson->type,
                'duration_minutes' => $lesson->duration_minutes,
                'position' => $lesson->position,
                'completed' => $completedSet->has($lesson->id),
            ])->values();

            return [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'position' => $module->position,
                'lessons' => $lessons->all(),
                'total_lessons' => $lessons->count(),
                'completed_lessons' => $lessons->where('completed', true)->count(),
            ];
        })->values();

        return [
            'id' => $e->id,
            'status' => $e->status,
            'enrolled_at' => $e->enrolled_at?->toISOString(),
            'completed_at' => $e->completed_at?->toISOString(),
            'user' => [
                'id' => $e->user?->id,
                'name' => $e->user?->name,
                'email' => $e->user?->email,
                'avatar_path' => $e->user?->avatar_path,
            ],
            'course' => [
                'id' => $e->course?->id,
                'title' => $e->course?->title,
                'slug' => $e->course?->slug,
            ],
            'modules' => $modules->all(),
            'progress' => $this->progressStats($e),
        ];
    }

    private function adminPayload(Request $request): array
    {
        $admin = $request->user();

        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'avatar_path' => $admin->avatar_path,
            'email_two_factor_enabled' => (bool) $admin->email_two_factor_enabled,
        ];
    }
}