<?php

namespace App\Http\Controllers;

use App\Models\AchievementDefinition;
use App\Models\Course;
use App\Models\Lesson;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicHomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Seo::publicPage(
            title: 'Learn With Flevian — Online Learning & Skills Platform in Kenya',
            description: 'Learn With Flevian is an online learning platform for practical courses, programming, web development, technology skills, structured learning and meaningful achievements.',
            canonical: 'https://lwf.yaliid.cloud/',
        );

        $publishedCourseScope = fn ($query) => $query
            ->where('courses.status', 'published')
            ->whereNotNull('courses.published_at');

        $courses = Course::query()
            ->with('category:id,name,slug')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->with([
                'modules:id,course_id',
                'modules.lessons:id,module_id,status',
            ])
            ->latest('published_at')
            ->limit(6)
            ->get()
            ->map(function (Course $course): array {
                $lessons = $course->modules->flatMap->lessons;

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'short_description' => $course->short_description,
                    'thumbnail_path' => $course->thumbnail_path,
                    'level' => $course->level,
                    'access_type' => $course->access_type,
                    'price' => $course->price,
                    'currency' => $course->currency,
                    'category' => $course->category ? [
                        'name' => $course->category->name,
                        'slug' => $course->category->slug,
                    ] : null,
                    'modules_count' => $course->modules->count(),
                    'lessons_count' => $lessons->where('status', 'published')->count(),
                ];
            });

        $publishedCourses = Course::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->count();

        $publishedLessons = Lesson::query()
            ->where('status', 'published')
            ->whereHas('module.course', $publishedCourseScope)
            ->count();

        $achievements = AchievementDefinition::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(4)
            ->get(['id', 'name', 'description', 'icon', 'points'])
            ->map(fn (AchievementDefinition $achievement): array => [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'icon' => $achievement->icon,
                'points' => $achievement->points,
            ]);

        return Inertia::render('Home', [
            'courses' => $courses,
            'publishedCourses' => $publishedCourses,
            'publishedLessons' => $publishedLessons,
            'achievements' => $achievements,
        ]);
    }
}
