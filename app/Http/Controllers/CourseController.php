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
     * Display a published course.
     *
     * The complete course catalogue/curriculum structure remains visible
     * to students. Actual lesson content and materials are restricted
     * according to CourseAccessService.
     */
    public function show(
        Request $request,
        string $slug,
    ): Response {
        $user = $request->user();

        abort_unless($user !== null, 403);

        /*
         * Load the course and its complete curriculum structure.
         *
         * We intentionally load all published lessons so the student
         * can see the complete course outline even when some content
         * is locked.
         */
        $course = Course::query()
            ->with([
                'category',

                'modules' => function ($query) use ($user) {
                    $query
                        ->with([
                            'lessons' => function ($lessonQuery) use ($user) {
                                $lessonQuery
                                    ->where('status', 'published')
                                    ->with([
                                        'progress' => function ($progressQuery) use ($user) {
                                            $progressQuery->where(
                                                'user_id',
                                                $user->id,
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
         * Determine effective access on the server.
         *
         * free  = complete access
         * full  = payment/admin approval has granted access
         * preview = course information + preview content only
         */
        $accessLevel = $this->courseAccessService
            ->accessLevel($user, $course);

        $hasFullAccess = $this->courseAccessService
            ->hasFullAccess($user, $course);

        /*
         * Build the complete visible curriculum.
         *
         * IMPORTANT:
         *
         * Locked modules remain visible.
         * Locked lessons remain visible as locked items.
         * Protected lesson content is NOT sent.
         * Protected materials are NOT sent.
         */
        $modules = $course->modules
            ->map(function ($module) use (
                $user,
                $hasFullAccess,
            ) {
                $moduleIsPreview = $module->is_preview === true;

                $moduleCanAccess =
                    $hasFullAccess || $moduleIsPreview;

                $lessons = $module->lessons
                    ->map(function ($lesson) use (
                        $user,
                        $hasFullAccess,
                        $moduleIsPreview,
                    ) {
                        $lessonIsPreview =
                            $lesson->is_preview === true
                            || $moduleIsPreview;

                        $canAccessLesson =
                            $hasFullAccess
                            || $lessonIsPreview;

                        /*
                         * Only send materials which the student is
                         * actually allowed to access.
                         */
                        $materials = collect();

                        if ($canAccessLesson) {
                            $materials = $lesson->materials
                                ->filter(function ($material) use ($user) {
                                    return $this->courseAccessService
                                        ->canAccessMaterial(
                                            $user,
                                            $material,
                                        );
                                })
                                ->map(function ($material) {
                                    return [
                                        'id' => $material->id,
                                        'title' => $material->title,
                                        'description' => $material->description,
                                        'type' => $material->type,

                                        /*
                                         * URLs/file paths are only included
                                         * after access has been established.
                                         */
                                        'url' => $material->url,
                                        'file_path' => $material->file_path,
                                        'mime_type' => $material->mime_type,

                                        'is_preview' => $material->is_preview,
                                        'position' => $material->position,
                                        'metadata' => $material->metadata,
                                    ];
                                })
                                ->values();
                        }

                        $progress = $lesson->progress->first();

                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'slug' => $lesson->slug,

                            /*
                             * Description is course-preview information,
                             * so it can remain visible for preview lessons.
                             *
                             * For locked lessons, don't expose it.
                             */
                            'description' => $canAccessLesson
                                ? $lesson->description
                                : null,

                            /*
                             * NEVER expose protected lesson content.
                             */
                            'content' => $canAccessLesson
                                ? $lesson->content
                                : null,

                            'type' => $lesson->type,
                            'position' => $lesson->position,
                            'is_preview' => $lessonIsPreview,
                            'duration_minutes' => $lesson->duration_minutes,

                            'locked' => ! $canAccessLesson,
                            'can_access' => $canAccessLesson,

                            'completed' => $canAccessLesson
                                && $progress?->status === 'completed',

                            'materials' => $materials->all(),
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

        /*
         * Course statistics.
         */
        $totalModules = $course->modules->count();

        $totalLessons = $course->modules
            ->sum(
                fn ($module) =>
                    $module->lessons->count(),
            );

        $previewModules = $course->modules
            ->filter(
                fn ($module) =>
                    $module->is_preview === true,
            )
            ->values();

        $previewLessons = $course->modules
            ->filter(
                fn ($module) =>
                    $module->is_preview === true,
            )
            ->flatMap(
                fn ($module) =>
                    $module->lessons,
            )
            ->filter(
                fn ($lesson) =>
                    $lesson->is_preview === true
                    || $lesson->module?->is_preview === true,
            )
            ->values();

        $visibleLessons = $modules
            ->sum(
                fn ($module) =>
                    collect($module['lessons'])
                        ->where('can_access', true)
                        ->count(),
            );

        $completedLessons = $modules
            ->flatMap(
                fn ($module) =>
                    $module['lessons'],
            )
            ->where('completed', true)
            ->count();

        /*
         * Current enrollment.
         */
        $enrollment = $this->courseAccessService
            ->enrollment($user, $course);

        /*
         * Load dashboard data once.
         *
         * StudentLayout requires the same student/stats contract
         * used by Dashboard, Support and the other student pages.
         */
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

                'published_at' => $course->published_at
                    ?->toISOString(),

                /*
                 * Effective access.
                 */
                'access_level' => $accessLevel,
                'access_granted' => $hasFullAccess,

                /*
                 * Enrollment.
                 */
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

                /*
                 * Course statistics.
                 */
                'total_modules' => $totalModules,
                'total_lessons' => $totalLessons,

                'visible_lessons' => $visibleLessons,
                'completed_lessons' => $completedLessons,

                'preview_module_count' =>
                    $previewModules->count(),

                'preview_lesson_count' =>
                    $previewLessons->count(),

                'preview_available' =>
                    $previewModules->isNotEmpty(),

                /*
                 * Complete curriculum outline.
                 *
                 * Locked items are represented as locked instead of
                 * disappearing from the course.
                 */
                'modules' => $modules->all(),
            ],
        ]);
    }
}