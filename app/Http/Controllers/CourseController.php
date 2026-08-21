<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Services\CourseAccessService;
use App\Services\StudentDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function __construct(
        protected CourseAccessService $courseAccessService,
        protected StudentDashboardService $studentDashboardService,
    ) {
    }

    /**
     * Course overview / preview.
     *
     * This endpoint deliberately exposes the course structure so students
     * can understand what they are buying.
     *
     * Protected lesson content and protected materials are never exposed.
     */
    public function show(
        Request $request,
        string $slug,
    ): Response {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $course = Course::query()
            ->with([
                'category',
                'modules' => function ($query) {
                    $query
                        ->with([
                            'lessons' => function ($lessonQuery) {
                                $lessonQuery
                                    ->where('status', 'published')
                                    ->orderBy('position');
                            },
                        ])
                        ->orderBy('position');
                },
            ])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $accessLevel = $this->courseAccessService
            ->accessLevel($user, $course);

        $hasFullAccess = $this->courseAccessService
            ->hasFullAccess($user, $course);

        $enrollment = $this->courseAccessService
            ->enrollment($user, $course);

        /*
         * Complete curriculum outline.
         *
         * Locked lessons remain visible, but protected details are not.
         */
        $modules = $course->modules
            ->map(function ($module) use ($hasFullAccess) {
                $moduleIsPreview = $module->is_preview === true;

                $moduleCanAccess =
                    $hasFullAccess || $moduleIsPreview;

                $lessons = $module->lessons
                    ->map(function ($lesson) use (
                        $hasFullAccess,
                        $moduleIsPreview,
                    ) {
                        $lessonIsPreview =
                            $lesson->is_preview === true
                            || $moduleIsPreview;

                        $canAccess =
                            $hasFullAccess || $lessonIsPreview;

                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'slug' => $lesson->slug,

                            /*
                             * Descriptions of preview lessons are safe.
                             * Locked lesson descriptions remain protected.
                             */
                            'description' => $canAccess
                                ? $lesson->description
                                : null,

                            /*
                             * NEVER expose protected lesson content here.
                             */
                            'content' => null,

                            'type' => $lesson->type,
                            'position' => $lesson->position,
                            'duration_minutes' => $lesson->duration_minutes,

                            'is_preview' => $lessonIsPreview,
                            'locked' => ! $canAccess,
                            'can_access' => $canAccess,

                            'materials' => [],
                        ];
                    })
                    ->values();

                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'position' => $module->position,

                    'is_preview' => $moduleIsPreview,
                    'locked' => ! $moduleCanAccess,
                    'can_access' => $moduleCanAccess,

                    'lessons' => $lessons->all(),
                ];
            })
            ->values();

        $totalModules = $course->modules->count();

        $totalLessons = $course->modules
            ->sum(
                fn ($module) =>
                    $module->lessons->count(),
            );

        $previewLessonCount = $course->modules
            ->flatMap(
                fn ($module) =>
                    $module->lessons,
            )
            ->filter(
                fn ($lesson) =>
                    $lesson->is_preview === true
                    || $lesson->module?->is_preview === true,
            )
            ->count();

        $dashboard = $this->studentDashboardService
            ->getDashboardData($user);

        return Inertia::render('Course', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],

            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,

                'short_description' => $course->short_description,
                'description' => $course->description,

                'thumbnail_path' => $course->thumbnail_path,

                'level' => $course->level,
                'category' => $course->category?->name,

                'access_type' => $course->access_type,
                'price' => $course->price,
                'currency' => $course->currency,

                'access_level' => $accessLevel,
                'access_granted' => $hasFullAccess,

                'enrolled' => $enrollment !== null,

                'enrollment' => $enrollment
                    ? [
                        'status' => $enrollment->status,
                        'source' => $enrollment->source,
                        'access_granted_at' => $enrollment
                            ->access_granted_at
                            ?->toISOString(),
                        'enrolled_at' => $enrollment
                            ->enrolled_at
                            ?->toISOString(),
                        'started_at' => $enrollment
                            ->started_at
                            ?->toISOString(),
                        'completed_at' => $enrollment
                            ->completed_at
                            ?->toISOString(),
                    ]
                    : null,

                'total_modules' => $totalModules,
                'total_lessons' => $totalLessons,
                'preview_lesson_count' => $previewLessonCount,

                'preview_available' => $previewLessonCount > 0,

                'modules' => $modules->all(),
            ],
        ]);
    }

    /**
     * Protected learning environment.
     *
     * Only free courses or paid courses with granted access can reach this
     * endpoint.
     */
    public function learn(
        Request $request,
        string $slug,
    ): Response {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $course = Course::query()
            ->with([
                'category',

                'modules' => function ($query) {
                    $query
                        ->with([
                            'lessons' => function ($lessonQuery) {
                                $lessonQuery
                                    ->where('status', 'published')
                                    ->with([
                                        'progress' => function ($progressQuery) {
                                            $progressQuery->where(
                                                'user_id',
                                                auth()->id(),
                                            );
                                        },

                                        'materials' => function ($materialQuery) {
                                            $materialQuery
                                                ->where('status', 'published')
                                                ->orderBy('position');
                                        },
                                    ])
                                    ->orderBy('position');
                            },
                        ])
                        ->orderBy('position');
                },
            ])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        /*
         * SECURITY BOUNDARY.
         *
         * The student cannot access the learning environment merely
         * because the course exists in the catalogue.
         */
        abort_unless(
            $this->courseAccessService->hasFullAccess(
                $user,
                $course,
            ),
            403,
            'You do not currently have access to this course.',
        );

        $modules = $course->modules
            ->map(function ($module) use ($user) {
                $lessons = $module->lessons
                    ->map(function ($lesson) use ($user) {
                        $progress = $lesson->progress->first();

                        $materials = $lesson->materials
                            ->filter(
                                fn ($material) =>
                                    $this->courseAccessService
                                        ->canAccessMaterial(
                                            $user,
                                            $material,
                                        ),
                            )
                            ->map(function ($material) {
                                return [
                                    'id' => $material->id,
                                    'title' => $material->title,
                                    'description' => $material->description,
                                    'type' => $material->type,
                                    'url' => $material->url,
                                    'file_path' => $material->file_path,
                                    'mime_type' => $material->mime_type,
                                    'is_preview' => $material->is_preview,
                                    'position' => $material->position,
                                    'metadata' => $material->metadata,
                                ];
                            })
                            ->values();

                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'slug' => $lesson->slug,
                            'description' => $lesson->description,
                            'content' => $lesson->content,

                            'type' => $lesson->type,
                            'position' => $lesson->position,
                            'duration_minutes' => $lesson->duration_minutes,

                            'is_preview' => $lesson->is_preview,
                            'locked' => false,
                            'can_access' => true,

                            'completed' =>
                                $progress?->status === 'completed',

                            'progress' => $progress
                                ? [
                                    'id' => $progress->id,
                                    'status' => $progress->status,
                                    'completed_at' => $progress
                                        ->completed_at
                                        ?->toISOString(),
                                ]
                                : null,

                            'materials' => $materials->all(),
                        ];
                    })
                    ->values();

                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'position' => $module->position,
                    'is_preview' => $module->is_preview,
                    'locked' => false,
                    'can_access' => true,
                    'lessons' => $lessons->all(),
                ];
            })
            ->values();

        $totalLessons = $modules
            ->sum(
                fn ($module) =>
                    count($module['lessons']),
            );

        $completedLessons = $modules
            ->flatMap(
                fn ($module) =>
                    $module['lessons'],
            )
            ->filter(
                fn ($lesson) =>
                    $lesson['completed'] === true,
            )
            ->count();

        $progressPercentage = $totalLessons > 0
            ? (int) round(
                ($completedLessons / $totalLessons) * 100,
            )
            : 0;

        $enrollment = $this->courseAccessService
            ->enrollment($user, $course);

        $dashboard = $this->studentDashboardService
            ->getDashboardData($user);

        return Inertia::render('CourseLearn', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],

            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,

                'short_description' => $course->short_description,
                'description' => $course->description,

                'thumbnail_path' => $course->thumbnail_path,

                'level' => $course->level,
                'category' => $course->category?->name,

                'access_type' => $course->access_type,
                'price' => $course->price,
                'currency' => $course->currency,

                'access_level' => 'full',
                'access_granted' => true,

                'enrolled' => $enrollment !== null,

                'enrollment' => $enrollment
                    ? [
                        'status' => $enrollment->status,
                        'source' => $enrollment->source,
                        'access_granted_at' => $enrollment
                            ->access_granted_at
                            ?->toISOString(),
                        'enrolled_at' => $enrollment
                            ->enrolled_at
                            ?->toISOString(),
                        'started_at' => $enrollment
                            ->started_at
                            ?->toISOString(),
                        'completed_at' => $enrollment
                            ->completed_at
                            ?->toISOString(),
                    ]
                    : null,

                'total_modules' => $modules->count(),
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'progress_percentage' => $progressPercentage,

                'modules' => $modules->all(),
            ],
        ]);
    }
}