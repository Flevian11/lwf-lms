<?php

namespace App\Services;

use App\Models\AchievementDefinition;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\PointTransaction;
use App\Models\StudentLearningActivity;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Support\Facades\DB;

class CourseEnrollmentRewardService
{
    private const ENROLLMENT_POINTS = 10;

    /**
     * Record the learning activity, award the course-specific achievement
     * and create the corresponding points transaction atomically.
     */
    public function recordEnrollment(
        User $user,
        Course $course,
        CourseEnrollment $enrollment,
    ): array {
        return DB::transaction(function () use ($user, $course, $enrollment): array {
            $activity = StudentLearningActivity::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'lesson_id' => null,
                'assignment_id' => null,
                'quiz_id' => null,
                'activity_type' => 'course_enrollment',
                'points' => self::ENROLLMENT_POINTS,
                'metadata' => [
                    'enrollment_id' => $enrollment->id,
                    'course_slug' => $course->slug,
                    'access_type' => $course->access_type,
                    'access_granted' => $enrollment->hasAccess(),
                ],
                'occurred_at' => now(),
            ]);

            $achievement = AchievementDefinition::query()->firstOrCreate(
                [
                    'slug' => 'enrolled-course-'.$course->slug,
                ],
                [
                    'name' => 'Enrolled in '.$course->title,
                    'description' => 'You enrolled in '.$course->title.'.',
                    'icon' => 'book-open',
                    'points' => self::ENROLLMENT_POINTS,
                    'criteria_type' => 'course_enrollment',
                    'criteria' => [
                        'course_slug' => $course->slug,
                        'course_id' => $course->id,
                    ],
                    'is_active' => true,
                    'sort_order' => 100,
                ],
            );

            $userAchievement = UserAchievement::query()
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->first();

            $achievementAwarded = false;

            if (! $userAchievement) {
                $userAchievement = UserAchievement::create([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'points_awarded' => (int) $achievement->points,
                    'metadata' => [
                        'course_id' => $course->id,
                        'course_slug' => $course->slug,
                        'enrollment_id' => $enrollment->id,
                    ],
                    'earned_at' => now(),
                ]);

                PointTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'course_enrollment',
                    'points' => (int) $achievement->points,
                    'description' => 'Achievement earned: '.$achievement->name,
                    'course_id' => $course->id,
                    'assignment_id' => null,
                    'quiz_id' => null,
                    'achievement_id' => $achievement->id,
                    'metadata' => [
                        'enrollment_id' => $enrollment->id,
                        'user_achievement_id' => $userAchievement->id,
                    ],
                    'awarded_at' => now(),
                ]);

                $achievementAwarded = true;
            }

            return [
                'activity_id' => $activity->id,
                'achievement_id' => $achievement->id,
                'achievement_awarded' => $achievementAwarded,
                'points_awarded' => $achievementAwarded
                    ? (int) $achievement->points
                    : 0,
            ];
        });
    }
}
