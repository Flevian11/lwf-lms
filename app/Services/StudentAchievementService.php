<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\CourseEnrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Collection;

class StudentAchievementService
{
    public function build(User $user): array
    {
        $earned = $user->achievements()
            ->with('achievement')
            ->whereHas('achievement', fn ($q) => $q->where('is_active', true))
            ->latest('earned_at')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->achievement->name,
                'description' => $item->achievement->description,
                'icon' => $item->achievement->icon ?: 'trophy',
                'points' => (int) $item->points_awarded,
                'earned_at' => $item->earned_at?->toISOString(),
            ])
            ->values();

        $enrollments = CourseEnrollment::query()
            ->with('course:id,title,slug,thumbnail_path')
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->orderByDesc('completed_at')
            ->get();

        $courseIds = $user->courseEnrollments()->pluck('course_id');

        $assignments = Assignment::query()
            ->with('course:id,title,slug')
            ->where('status', 'published')
            ->whereIn('course_id', $courseIds)
            ->whereHas('allocations', fn ($q) => $q->where('user_id', $user->id))
            ->get();

        $latestSubmissions = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->whereIn('assignment_id', $assignments->pluck('id'))
            ->where('status', 'graded')
            ->orderByDesc('attempt_number')
            ->get()
            ->groupBy('assignment_id')
            ->map(fn ($items) => $items->first());

        $assignmentResults = $assignments
            ->filter(fn (Assignment $assignment) => $latestSubmissions->has($assignment->id))
            ->map(function (Assignment $assignment) use ($latestSubmissions) {
                $submission = $latestSubmissions->get($assignment->id);
                $max = (int) $assignment->max_points;
                $score = $submission?->score;

                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'course' => $assignment->course?->title,
                    'score' => $score !== null ? (int) $score : null,
                    'max_points' => $max,
                    'percentage' => $score !== null && $max > 0 ? round(($score / $max) * 100, 1) : null,
                    'graded_at' => $submission?->graded_at?->toISOString(),
                    'transcript_url' => $submission?->transcript_path
                        ? route('assignments.submissions.transcript', [$assignment->id, $submission->id])
                        : null,
                ];
            })
            ->sortByDesc('graded_at')
            ->values();

        $quizzes = Quiz::query()
            ->with('course:id,title,slug')
            ->where('status', 'published')
            ->whereIn('course_id', $courseIds)
            ->get();

        $passedQuizAttempts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->where('status', 'graded')
            ->where('passed', true)
            ->orderByDesc('graded_at')
            ->get()
            ->groupBy('quiz_id')
            ->map(fn ($items) => $items->first());

        $quizResults = $quizzes
            ->filter(fn (Quiz $quiz) => $passedQuizAttempts->has($quiz->id))
            ->map(function (Quiz $quiz) use ($passedQuizAttempts) {
                $attempt = $passedQuizAttempts->get($quiz->id);

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'course' => $quiz->course?->title,
                    'score' => $attempt?->score !== null ? (int) $attempt->score : null,
                    'max_score' => $attempt?->max_score !== null ? (int) $attempt->max_score : null,
                    'percentage' => $attempt?->percentage !== null ? (float) $attempt->percentage : null,
                    'passed_at' => $attempt?->graded_at?->toISOString(),
                ];
            })
            ->sortByDesc('passed_at')
            ->values();

        $points = (int) $user->pointTransactions()->sum('points');

        return [
            'earned_achievements' => $earned->all(),
            'completed_courses' => $enrollments->map(fn (CourseEnrollment $enrollment) => [
                'id' => $enrollment->id,
                'course_id' => $enrollment->course_id,
                'title' => $enrollment->course?->title,
                'slug' => $enrollment->course?->slug,
                'completed_at' => $enrollment->completed_at?->toISOString(),
                'certificate_url' => route('certificates.download', $enrollment->id),
            ])->values()->all(),
            'assignment_results' => $assignmentResults->all(),
            'quiz_results' => $quizResults->all(),
            'stats' => [
                'achievements' => $earned->count(),
                'completed_courses' => $enrollments->count(),
                'graded_assignments' => $assignmentResults->count(),
                'passed_quizzes' => $quizResults->count(),
                'points' => $points,
            ],
        ];
    }
}
