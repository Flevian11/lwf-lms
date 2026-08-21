<?php

namespace App\Services;

use App\Models\AchievementDefinition;
use App\Models\AssignmentSubmission;
use App\Models\PointTransaction;
use App\Models\StudentLearningActivity;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Support\Facades\DB;

class AssignmentSubmissionRewardService
{
    private const FIRST_SUBMISSION_POINTS = 10;

    /**
     * Award the first-assignment achievement exactly once.
     *
     * The check happens before the current submission is considered a
     * previous submission, so the reward is tied to the first real submit
     * event rather than a draft save or page visit.
     */
    public function awardFirstSubmissionIfEligible(
        User $user,
        AssignmentSubmission $submission,
    ): array {
        $alreadySubmitted = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['submitted', 'late', 'graded', 'returned'])
            ->where('id', '!=', $submission->id)
            ->exists();

        if ($alreadySubmitted) {
            return [
                'awarded' => false,
                'achievement_id' => null,
                'points' => 0,
            ];
        }

        $achievement = AchievementDefinition::query()->firstOrCreate(
            ['slug' => 'first-assignment-submission'],
            [
                'name' => 'First Assignment Submitted',
                'description' => 'You submitted your first assignment on Learn With Flevian.',
                'icon' => 'assignment',
                'points' => self::FIRST_SUBMISSION_POINTS,
                'criteria_type' => 'first_assignment_submission',
                'criteria' => [
                    'first_submission_only' => true,
                ],
                'is_active' => true,
                'sort_order' => 20,
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
            'points_awarded' => self::FIRST_SUBMISSION_POINTS,
            'metadata' => [
                'assignment_id' => $submission->assignment_id,
                'submission_id' => $submission->id,
                'attempt_number' => $submission->attempt_number,
            ],
            'earned_at' => now(),
        ]);

        PointTransaction::create([
            'user_id' => $user->id,
            'type' => 'assignment_first_submission',
            'points' => self::FIRST_SUBMISSION_POINTS,
            'description' => 'Achievement earned: First Assignment Submitted',
            'course_id' => $submission->assignment?->course_id,
            'assignment_id' => $submission->assignment_id,
            'quiz_id' => null,
            'achievement_id' => $achievement->id,
            'metadata' => [
                'submission_id' => $submission->id,
                'user_achievement_id' => $userAchievement->id,
            ],
            'awarded_at' => now(),
        ]);

        StudentLearningActivity::create([
            'user_id' => $user->id,
            'course_id' => $submission->assignment?->course_id,
            'lesson_id' => null,
            'assignment_id' => $submission->assignment_id,
            'quiz_id' => null,
            'activity_type' => 'first_assignment_submission',
            'points' => self::FIRST_SUBMISSION_POINTS,
            'metadata' => [
                'submission_id' => $submission->id,
                'achievement_id' => $achievement->id,
            ],
            'occurred_at' => now(),
        ]);

        return [
            'awarded' => true,
            'achievement_id' => $achievement->id,
            'points' => self::FIRST_SUBMISSION_POINTS,
        ];
    }
}
