<?php

namespace App\Http\Controllers;

use App\Models\CourseEnrollment;
use App\Models\LessonProgress;
use App\Services\StudentDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentProgressController extends Controller
{
    public function __construct(
        protected StudentDashboardService $studentDashboardService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $enrollments = CourseEnrollment::query()
            ->with([
                'course' => function ($q) {
                    $q->with([
                        'modules' => fn ($mq) => $mq->orderBy('position'),
                        'modules.lessons' => fn ($lq) => $lq
                            ->where('status', 'published')
                            ->orderBy('position'),
                    ]);
                },
            ])
            ->where('user_id', $user->id)
            ->whereNotIn('status', ['cancelled'])
            ->latest('enrolled_at')
            ->get();

        // Same completion rule as CourseController@learn.
        $completedLessonIds = LessonProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->pluck('lesson_id')
            ->flip();

        $courses = $enrollments
            ->map(function (CourseEnrollment $enrollment) use ($completedLessonIds) {
                $course = $enrollment->course;
                if (! $course) {
                    return null;
                }

                $modules = $course->modules
                    ->map(function ($module) use ($completedLessonIds) {
                        $lessons = $module->lessons
                            ->map(fn ($lesson) => [
                                'id' => $lesson->id,
                                'title' => $lesson->title,
                                'slug' => $lesson->slug,
                                'type' => $lesson->type,
                                'duration_minutes' => $lesson->duration_minutes,
                                'completed' => $completedLessonIds->has($lesson->id),
                            ])
                            ->values();

                        return [
                            'id' => $module->id,
                            'title' => $module->title,
                            'description' => $module->description,
                            'position' => $module->position,
                            'lessons' => $lessons->all(),
                            'total_lessons' => $lessons->count(),
                            'completed_lessons' => $lessons->where('completed', true)->count(),
                        ];
                    })
                    ->values();

                $totalLessons = $modules->sum('total_lessons');
                $completedLessons = $modules->sum('completed_lessons');
                $percent = $totalLessons > 0
                    ? (int) round(($completedLessons / $totalLessons) * 100)
                    : 0;

                return [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                    'completed_at' => $enrollment->completed_at?->toISOString(),
                    'course' => [
                        'id' => $course->id,
                        'title' => $course->title,
                        'slug' => $course->slug,
                        'thumbnail_path' => $course->thumbnail_path,
                        'level' => $course->level,
                    ],
                    'modules' => $modules->all(),
                    'total_lessons' => $totalLessons,
                    'completed_lessons' => $completedLessons,
                    'percent' => $percent,
                ];
            })
            ->filter()
            ->values();

        $totalLessons = $courses->sum('total_lessons');
        $completedLessons = $courses->sum('completed_lessons');
        $overallPercent = $totalLessons > 0
            ? (int) round(($completedLessons / $totalLessons) * 100)
            : 0;

        $dashboard = $this->studentDashboardService
            ->getDashboardData($user);

        return Inertia::render('Progress', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'courses' => $courses->all(),
            'summary' => [
                'total_courses' => $courses->count(),
                'completed_courses' => $courses->where('percent', 100)->count(),
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'overall_percent' => $overallPercent,
            ],
        ]);
    }
}