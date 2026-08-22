<?php

namespace App\Http\Controllers;

use App\Models\AchievementDefinition;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicHomeController extends Controller
{
    /**
     * Public landing page.
     *
     * Only catalogue-safe information is exposed here. Protected lesson
     * content, private student records and enrollment details are never
     * returned to guests.
     */
    public function __invoke(Request $request): Response
    {
        $publishedCourses = Course::query()
            ->where('status', 'published');

        $courses = (clone $publishedCourses)
            ->with([
                'category:id,name,slug',
                'modules' => function ($query) {
                    $query
                        ->select(['id', 'course_id', 'title', 'position'])
                        ->withCount([
                            'lessons as published_lessons_count' => function ($lessonQuery) {
                                $lessonQuery->where('status', 'published');
                            },
                        ])
                        ->orderBy('position');
                },
            ])
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(6)
            ->get();

        $courseItems = $courses->map(function (Course $course) {
            $publishedLessonCount = $course->modules->sum(
                fn ($module) => (int) $module->published_lessons_count
            );

            return [
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
                'module_count' => $course->modules->count(),
                'lesson_count' => $publishedLessonCount,
            ];
        })->values();

        $categoryItems = CourseCategory::query()
            ->where('is_active', true)
            ->withCount([
                'courses as published_courses_count' => function ($query) {
                    $query->where('status', 'published');
                },
            ])
            ->having('published_courses_count', '>', 0)
            ->orderByDesc('published_courses_count')
            ->orderBy('name')
            ->limit(6)
            ->get(['id', 'name', 'slug'])
            ->map(fn (CourseCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'course_count' => (int) $category->published_courses_count,
            ])
            ->values();

        $achievements = AchievementDefinition::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(6)
            ->get([
                'id',
                'name',
                'slug',
                'description',
                'icon',
                'points',
            ])
            ->map(fn (AchievementDefinition $achievement) => [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'slug' => $achievement->slug,
                'description' => $achievement->description,
                'icon' => $achievement->icon,
                'points' => (int) $achievement->points,
            ])
            ->values();

        $learnerCount = CourseEnrollment::query()
            ->whereIn('status', ['active', 'completed'])
            ->whereNotNull('access_granted_at')
            ->distinct('user_id')
            ->count('user_id');

        $completedEnrollmentCount = CourseEnrollment::query()
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->count();

        $lessonCount = Lesson::query()
            ->where('status', 'published')
            ->whereHas('module.course', function ($query) {
                $query->where('status', 'published');
            })
            ->count();

        return Inertia::render('Home', [
            'authenticated' => $request->user() !== null,
            'stats' => [
                'published_courses' => (clone $publishedCourses)->count(),
                'learners' => $learnerCount,
                'published_lessons' => (int) $lessonCount,
                'completed_enrollments' => $completedEnrollmentCount,
            ],
            'courses' => $courseItems,
            'categories' => $categoryItems,
            'achievements' => $achievements,
        ]);
    }
}
