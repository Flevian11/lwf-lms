<?php

namespace App\Services;

use App\Models\AchievementDefinition;
use App\Models\PointTransaction;
use App\Models\QuizAttempt;
use App\Models\StudentLearningActivity;
use App\Models\User;
use App\Models\UserAchievement;

class QuizCompletionRewardService
{
    private const FIRST_QUIZ_POINTS = 10;

    /**
     * Award the first-quiz achievement exactly once.
     *
     * This is called after the current attempt has been graded. The current
     * attempt is excluded from the previous-completion check so this remains
     * correct even though the current attempt is already marked as graded.
     */
    public function awardFirstQuizIfEligible(
        User $user,
        QuizAttempt $attempt,
    ): array {
        $alreadyCompleted = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['graded', 'submitted'])
            ->where('id', '!=', $attempt->id)
            ->exists();

        if ($alreadyCompleted) {
            return [
                'awarded' => false,
                'achievement_id' => null,
                'points' => 0,
            ];
        }

        $achievement = AchievementDefinition::query()->firstOrCreate(
            ['slug' => 'first-quiz-completed'],
            [
                'name' => 'First Quiz Completed',
                'description' => 'You completed your first quiz on Learn With Flevian.',
                'icon' => 'quiz',
                'points' => self::FIRST_QUIZ_POINTS,
                'criteria_type' => 'first_quiz_completion',
                'criteria' => [
                    'first_quiz_only' => true,
                ],
                'is_active' => true,
                'sort_order' => 30,
            ],
        );

        $existingAchievement = UserAchievement::query()
            ->where('user_id', $user->id)
            ->where('achievement_id', $achievement->id)
            ->first();

        if ($existingAchievement) {
            return [
                'awarded' => false,
                'achievement_id' => $achievement->id,
                'points' => 0,
            ];
        }

        $userAchievement = UserAchievement::create([
            'user_id' => $user->id,
            'achievement_id' => $achievement->id,
            'points_awarded' => self::FIRST_QUIZ_POINTS,
            'metadata' => [
                'quiz_id' => $attempt->quiz_id,
                'attempt_id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'score' => $attempt->score,
                'max_score' => $attempt->max_score,
                'percentage' => $attempt->percentage,
            ],
            'earned_at' => now(),
        ]);

        PointTransaction::create([
            'user_id' => $user->id,
            'type' => 'quiz_first_completion',
            'points' => self::FIRST_QUIZ_POINTS,
            'description' => 'Achievement earned: First Quiz Completed',
            'course_id' => $attempt->quiz?->course_id,
            'assignment_id' => null,
            'quiz_id' => $attempt->quiz_id,
            'achievement_id' => $achievement->id,
            'metadata' => [
                'attempt_id' => $attempt->id,
                'user_achievement_id' => $userAchievement->id,
            ],
            'awarded_at' => now(),
        ]);

        StudentLearningActivity::create([
            'user_id' => $user->id,
            'course_id' => $attempt->quiz?->course_id,
            'lesson_id' => $attempt->quiz?->lesson_id,
            'assignment_id' => null,
            'quiz_id' => $attempt->quiz_id,
            'activity_type' => 'first_quiz_completion',
            'points' => self::FIRST_QUIZ_POINTS,
            'metadata' => [
                'attempt_id' => $attempt->id,
                'achievement_id' => $achievement->id,
            ],
            'occurred_at' => now(),
        ]);

        return [
            'awarded' => true,
            'achievement_id' => $achievement->id,
            'points' => self::FIRST_QUIZ_POINTS,
        ];
    }
}
