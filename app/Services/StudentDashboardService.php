<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Collection;

class StudentDashboardService
{
    public function __construct(
        protected CourseAccessService $courseAccessService,
    ) {
    }

    /**
     * Build the complete dashboard payload for a student.
     *
     * The service intentionally owns dashboard aggregation so the
     * controller remains responsible only for HTTP/Inertia concerns.
     */
    public function getDashboardData(User $user): array
    {
        return [
            'student' => $this->student($user),

            'stats' => [
                'courses' => $this->courseStats($user),
                'progress' => $this->progressStats($user),
                'points' => $this->pointStats($user),
                'streak' => $this->streakStats($user),
            ],

            'weekly_progress' => $this->weeklyProgress($user),

            'current_courses' => $this->currentCourses($user),

            'upcoming_assignments' => $this->upcomingAssignments($user),

            'upcoming_quizzes' => $this->upcomingQuizzes($user),

            'recent_activity' => $this->recentActivity($user),

            'achievements' => $this->achievements($user),

            'recommendations' => $this->recommendations($user),

            'leaderboard' => $this->leaderboard($user),
        ];
    }

    /**
     * Build the student courses page payload.
     *
     * "courses" contains the student's currently enrolled courses.
     *
     * "catalogue" contains published courses that can be discovered,
     * including courses the student has not enrolled in.
     */
    public function getCoursesData(User $user): array
    {
        return [
            'student' => $this->student($user),

            'stats' => [
                'courses' => $this->courseStats($user),
                'progress' => $this->progressStats($user),
                'points' => $this->pointStats($user),
                'streak' => $this->streakStats($user),
            ],

            'courses' => $this->currentCourses($user),

            'catalogue' => $this->courseCatalogue($user),
        ];
    }

    /**
     * Basic authenticated student information.
     */
    private function student(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_path' => $user->avatar_path,
            'timezone' => $user->timezone,
            'locale' => $user->locale,
        ];
    }

    /**
     * Course enrollment statistics.
     */
    private function courseStats(User $user): array
    {
        $enrollments = $user->courseEnrollments();

        return [
            'total' => (clone $enrollments)->count(),

            'active' => (clone $enrollments)
                ->where('status', 'active')
                ->count(),

            'completed' => (clone $enrollments)
                ->where('status', 'completed')
                ->count(),
        ];
    }

    /**
     * Overall lesson completion.
     */
    private function progressStats(User $user): array
    {
        $progress = $user->lessonProgress();

        $total = (clone $progress)->count();

        if ($total === 0) {
            return [
                'percentage' => 0,
                'completed_lessons' => 0,
                'tracked_lessons' => 0,
            ];
        }

        $completed = (clone $progress)
            ->where('status', 'completed')
            ->count();

        return [
            'percentage' => (int) round(
                ($completed / $total) * 100
            ),
            'completed_lessons' => $completed,
            'tracked_lessons' => $total,
        ];
    }

    /**
     * Total points earned by the student.
     */
    private function pointStats(User $user): array
    {
        $total = (int) $user->pointTransactions()->sum('points');

        return [
            'total' => $total,
        ];
    }

    /**
     * Calculate the student's learning streak from the authoritative
     * learning-activity history. The dashboard must never display a stale
     * cached streak when new activity has already been recorded.
     */
    private function streakStats(User $user): array
    {
        $dates = $user->learningActivities()
            ->whereNotNull('occurred_at')
            ->orderBy('occurred_at')
            ->pluck('occurred_at')
            ->map(fn ($occurredAt) => $occurredAt->copy()->startOfDay())
            ->unique(fn ($date) => $date->toDateString())
            ->values();

        if ($dates->isEmpty()) {
            return [
                'current' => 0,
                'longest' => 0,
                'last_activity_on' => null,
            ];
        }

        $today = now()->startOfDay();
        $lastActivity = $dates->last();
        $current = 0;

        // A streak is alive only when the latest learning activity happened
        // today or yesterday. This prevents an old streak from remaining
        // visible indefinitely.
        if ($lastActivity->diffInDays($today) <= 1) {
            $current = 1;
            $cursor = $lastActivity->copy();

            for ($index = $dates->count() - 2; $index >= 0; $index--) {
                $previous = $dates[$index];

                if ($cursor->diffInDays($previous) !== 1) {
                    break;
                }

                $current++;
                $cursor = $previous;
            }
        }

        $longest = 1;
        $run = 1;

        for ($index = 1; $index < $dates->count(); $index++) {
            if ($dates[$index]->diffInDays($dates[$index - 1]) === 1) {
                $run++;
                $longest = max($longest, $run);
            } else {
                $run = 1;
            }
        }

        return [
            'current' => $current,
            'longest' => $longest,
            'last_activity_on' => $lastActivity->toDateString(),
        ];
    }

    /**
     * Seven-day learning activity summary.
     */
    private function weeklyProgress(User $user): array
    {
        $start = now()
            ->startOfDay()
            ->subDays(6);

        $activities = $user->learningActivities()
            ->where('occurred_at', '>=', $start)
            ->orderBy('occurred_at')
            ->get();

        $days = collect();

        for ($i = 6; $i >= 0; $i--) {
            $date = now()
                ->startOfDay()
                ->subDays($i);

            $dayActivities = $activities->filter(
                fn ($activity) => $activity->occurred_at->isSameDay($date)
            );

            $days->push([
                'date' => $date->toDateString(),
                'label' => $date->format('D'),
                'activities' => $dayActivities->count(),
                'points' => (int) $dayActivities->sum('points'),
            ]);
        }

        return [
            'days' => $days->values()->all(),
            'total_activities' => $activities->count(),
            'total_points' => (int) $activities->sum('points'),
        ];
    }

    /**
     * Courses currently being studied.
     */
    private function currentCourses(User $user): array
    {
        return $user->courseEnrollments()
            ->with([
                'course.category',
                'course.modules.lessons',
            ])
            ->where('status', 'active')
            ->latest('enrolled_at')
            ->get()
            ->map(function ($enrollment) use ($user) {
                $course = $enrollment->course;

                if (! $course) {
                    return null;
                }

                $lessonIds = $course->modules
                    ->flatMap(fn ($module) => $module->lessons)
                    ->pluck('id');

                $completedLessons = $lessonIds->isEmpty()
                    ? 0
                    : $user->lessonProgress()
                        ->whereIn('lesson_id', $lessonIds)
                        ->where('status', 'completed')
                        ->count();

                $totalLessons = $lessonIds->count();

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'thumbnail_path' => $course->thumbnail_path,
                    'level' => $course->level,
                    'category' => $course->category?->name,

                    'progress' => $totalLessons > 0
                        ? (int) round(
                            ($completedLessons / $totalLessons) * 100
                        )
                        : 0,

                    'completed_lessons' => $completedLessons,
                    'total_lessons' => $totalLessons,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),

                    /*
                     * Explicit access information for the frontend.
                     */
                    'access_level' => $this->courseAccessService
                        ->accessLevel($user, $course),

                    'access_granted' => $this->courseAccessService
                        ->hasFullAccess($user, $course),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Published course catalogue.
     *
     * This is deliberately separate from currentCourses().
     *
     * currentCourses() answers:
     * "What am I currently studying?"
     *
     * courseCatalogue() answers:
     * "What published courses are available to discover?"
     */
    private function courseCatalogue(User $user): array
    {
        $enrolledCourseIds = $user->courseEnrollments()
            ->pluck('course_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return Course::query()
            ->with([
                'category',

                /*
                 * Course modules do not have a status column.
                 *
                 * Preview access is controlled through is_preview.
                 * Lessons themselves have their own status column.
                 */
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
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->orderBy('title')
            ->get()
            ->map(function (Course $course) use ($user, $enrolledCourseIds) {
                $modules = $course->modules;

                /*
                 * Only modules explicitly marked as preview are exposed
                 * as the public course preview.
                 */
                $previewModules = $modules
                    ->where('is_preview', true)
                    ->values();

                /*
                 * Because lessons were eager-loaded above, these are
                 * calculated from the already-loaded relationship rather
                 * than issuing additional queries for every module.
                 */
                $totalLessons = $modules->sum(
                    fn ($module) => $module->lessons->count()
                );

                $previewLessons = $previewModules->sum(
                    fn ($module) => $module->lessons
                        ->where('is_preview', true)
                        ->count()
                );

                $accessLevel = $this->courseAccessService
                    ->accessLevel($user, $course);

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

                    'published_at' => $course->published_at?->toISOString(),

                    /*
                     * Enrollment state.
                     */
                    'enrolled' => in_array(
                        $course->id,
                        $enrolledCourseIds,
                        true
                    ),

                    /*
                     * Effective access:
                     *
                      * full    = enrolled course with granted access
                     * preview = course awaiting access
                     */
                    'access_level' => $accessLevel,

                    'access_granted' => $this->courseAccessService
                        ->hasFullAccess($user, $course),

                    /*
                     * Preview/catalogue information.
                     */
                    'preview_available' => $previewModules->isNotEmpty(),

                    'preview_module_count' => $previewModules->count(),

                    'preview_lesson_count' => $previewLessons,

                    'module_count' => $modules->count(),

                    'lesson_count' => $totalLessons,

                    /*
                     * Only expose the preview structure to the catalogue.
                     *
                     * We do NOT send all lesson content here.
                     */
                    'preview_modules' => $previewModules
                        ->map(function ($module) {
                            return [
                                'id' => $module->id,
                                'title' => $module->title,
                                'description' => $module->description,
                                'position' => $module->position,

                                'lessons' => $module->lessons
                                    ->where('is_preview', true)
                                    ->sortBy('position')
                                    ->map(fn ($lesson) => [
                                        'id' => $lesson->id,
                                        'title' => $lesson->title,
                                        'slug' => $lesson->slug,
                                        'description' => $lesson->description,
                                        'type' => $lesson->type,
                                        'position' => $lesson->position,
                                        'duration_minutes' => $lesson->duration_minutes,
                                    ])
                                    ->values()
                                    ->all(),
                            ];
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Upcoming assignments specifically allocated to the student and not yet submitted.
     *
     * An assignment is not upcoming once the student has a submitted/graded attempt.
     * Drafts remain actionable because the student can still continue working on them.
     */
    private function upcomingAssignments(User $user): array
    {
        return \App\Models\Assignment::query()
            ->with(['course'])
            ->whereHas('allocations', fn ($query) =>
                $query->where('user_id', $user->id)
            )
            ->where('status', 'published')
            ->where(function ($query) {
                $query
                    ->whereNull('due_at')
                    ->orWhere('due_at', '>=', now());
            })
            ->whereDoesntHave('submissions', function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->whereIn('status', ['submitted', 'graded', 'late']);
            })
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->limit(5)
            ->get()
            ->map(fn ($assignment) => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'course' => $assignment->course?->title,
                'due_at' => $assignment->due_at?->toISOString(),
                'max_points' => $assignment->max_points,
                'status' => $assignment->status,
            ])
            ->values()
            ->all();
    }

    /**
     * Upcoming quizzes belonging to courses the student is enrolled in.
     *
     * A quiz is only "upcoming" while it still requires action. Passed
     * quizzes and quizzes whose attempts are exhausted are intentionally
     * removed from this dashboard section.
     */
    private function upcomingQuizzes(User $user): array
    {
        $courseIds = $user->courseEnrollments()
            ->where('status', 'active')
            ->whereNotNull('access_granted_at')
            ->pluck('course_id');

        if ($courseIds->isEmpty()) {
            return [];
        }

        $quizzes = Quiz::query()
            ->with(['course'])
            ->whereIn('course_id', $courseIds)
            ->where('status', 'published')
            ->where(function ($query) {
                $query
                    ->whereNull('due_at')
                    ->orWhere('due_at', '>=', now());
            })
            ->where(function ($query) {
                $query
                    ->whereNull('available_from')
                    ->orWhere('available_from', '<=', now());
            })
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->limit(20)
            ->get();

        if ($quizzes->isEmpty()) {
            return [];
        }

        $quizIds = $quizzes->pluck('id');

        $latestAttempts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('quiz_id', $quizIds)
            ->orderByDesc('attempt_number')
            ->get()
            ->groupBy('quiz_id')
            ->map(fn ($items) => $items->first());

        $attemptCounts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('quiz_id', $quizIds)
            ->whereIn('status', ['submitted', 'graded'])
            ->selectRaw('quiz_id, COUNT(*) as attempts_used')
            ->groupBy('quiz_id')
            ->pluck('attempts_used', 'quiz_id');

        return $quizzes
            ->filter(function (Quiz $quiz) use ($latestAttempts, $attemptCounts): bool {
                $latest = $latestAttempts->get($quiz->id);
                $used = (int) ($attemptCounts[$quiz->id] ?? 0);

                if ($latest?->passed === true) {
                    return false;
                }

                if ($quiz->max_attempts !== null && $used >= $quiz->max_attempts) {
                    return false;
                }

                return true;
            })
            ->take(5)
            ->map(fn (Quiz $quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'course' => $quiz->course?->title,
                'due_at' => $quiz->due_at?->toISOString(),
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'passing_score' => $quiz->passing_score,
                'max_attempts' => $quiz->max_attempts,
            ])
            ->values()
            ->all();
    }

    /**
     * Most recent learning activity.
     */
    private function recentActivity(User $user): array
    {
        return $user->learningActivities()
            ->with(['course', 'lesson', 'assignment', 'quiz'])
            ->latest('occurred_at')
            ->limit(10)
            ->get()
            ->map(fn ($activity) => [
                'id' => $activity->id,
                'type' => $activity->activity_type,
                'points' => $activity->points,
                'occurred_at' => $activity->occurred_at?->toISOString(),
                'course' => $activity->course?->title,
                'lesson' => $activity->lesson?->title,
                'assignment' => $activity->assignment?->title,
                'quiz' => $activity->quiz?->title,
            ])
            ->values()
            ->all();
    }

    /**
     * Student achievements.
     */
    private function achievements(User $user): array
    {
        return $user->achievements()
            ->with('achievement')
            ->latest('earned_at')
            ->limit(6)
            ->get()
            ->map(fn ($achievement) => [
                'id' => $achievement->achievement->id,
                'name' => $achievement->achievement->name,
                'description' => $achievement->achievement->description,
                'icon' => $achievement->achievement->icon,
                'points' => $achievement->points_awarded,
                'earned_at' => $achievement->earned_at?->toISOString(),
            ])
            ->values()
            ->all();
    }

    /**
     * Recommend published courses based on selected learning interests.
     *
     * Already-enrolled courses are excluded.
     */
    private function recommendations(User $user): array
    {
        $interestIds = $user->learningInterests()
            ->pluck('learning_interests.id');

        if ($interestIds->isEmpty()) {
            return [];
        }

        $enrolledCourseIds = $user->courseEnrollments()
            ->pluck('course_id');

        return Course::query()
            ->with(['category', 'learningInterests'])
            ->where('status', 'published')
            ->whereNotIn('id', $enrolledCourseIds)
            ->whereHas(
                'learningInterests',
                fn ($query) => $query->whereIn(
                    'learning_interests.id',
                    $interestIds
                )
            )
            ->withCount([
                'learningInterests as matching_interests_count' => fn ($query) =>
                    $query->whereIn(
                        'learning_interests.id',
                        $interestIds
                    ),
            ])
            ->orderByDesc('matching_interests_count')
            ->orderByDesc('published_at')
            ->limit(6)
            ->get()
            ->map(fn ($course) => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'short_description' => $course->short_description,
                'thumbnail_path' => $course->thumbnail_path,
                'level' => $course->level,
                'category' => $course->category?->name,
                'access_type' => $course->access_type,
                'price' => $course->price,
                'currency' => $course->currency,
                'matching_interests' => $course->matching_interests_count,
            ])
            ->values()
            ->all();
    }

    /**
     * Global points leaderboard.
     *
     * The student's own position is included even if they are
     * outside the first ten positions.
     */
    private function leaderboard(User $user): array
    {
        $totals = \App\Models\PointTransaction::query()
            ->select('user_id')
            ->selectRaw('SUM(points) as total_points')
            ->groupBy('user_id')
            ->orderByDesc('total_points')
            ->get();

        $rank = $totals
            ->search(fn ($row) => (int) $row->user_id === $user->id);

        $rank = $rank === false ? null : $rank + 1;

        $topUsers = $totals
            ->take(10)
            ->map(function ($row, $index) {
                $student = User::find($row->user_id);

                return [
                    'rank' => $index + 1,
                    'user_id' => $row->user_id,
                    'name' => $student?->name,
                    'avatar_path' => $student?->avatar_path,
                    'points' => (int) $row->total_points,
                ];
            })
            ->filter(fn ($row) => $row['name'] !== null)
            ->values()
            ->all();

        return [
            'rank' => $rank,
            'total_points' => (int) $user->pointTransactions()->sum('points'),
            'top_students' => $topUsers,
        ];
    }
}