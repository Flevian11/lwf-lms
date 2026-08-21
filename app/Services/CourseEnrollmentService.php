<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use App\Notifications\CourseEnrollmentNotification;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Throwable;

class CourseEnrollmentService
{
    public function __construct(
        protected AuditLogService $auditLogService,
        protected CourseEnrollmentRewardService $rewardService,
        protected DatabaseManager $database,
    ) {
    }

    /**
     * Create the enrollment and then run non-critical side effects.
     *
     * The enrollment transaction is the source-of-truth operation.
     * Audit logging, gamification and email are isolated deliberately:
     * none of them is allowed to roll back a successful enrollment.
     */
    public function enroll(
        User $user,
        Course $course,
        Request $request,
    ): array {
        $result = $this->database->transaction(function () use ($user, $course): array {
            $enrollment = CourseEnrollment::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->lockForUpdate()
                ->first();

            if ($enrollment) {
                return [
                    'enrollment' => $enrollment->fresh(),
                    'created' => false,
                ];
            }

            $now = now();
            $isFree = $course->access_type === 'free';

            $enrollment = CourseEnrollment::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'source' => $isFree ? 'free' : 'payment',
                'payment_id' => null,
                'approved_by' => null,
                'approved_at' => null,
                'access_granted_at' => $isFree ? $now : null,
                'status' => 'active',
                'enrolled_at' => $now,
                'started_at' => null,
                'completed_at' => null,
            ]);

            return [
                'enrollment' => $enrollment->fresh(),
                'created' => true,
            ];
        });

        $enrollment = $result['enrollment'];
        $course->loadMissing('category');
        $hasAccess = $enrollment->hasAccess();

        if ($result['created']) {
            $this->recordAudit(
                $user,
                $course,
                $enrollment,
                $request,
            );

            $this->recordLearningReward(
                $user,
                $course,
                $enrollment,
                $request,
            );

            $this->sendConfirmationEmail(
                $user,
                $course,
                $enrollment,
                $request,
            );
        }

        return [
            'enrollment' => $enrollment,
            'created' => $result['created'],
            'has_access' => $hasAccess,
        ];
    }

    protected function recordAudit(
        User $user,
        Course $course,
        CourseEnrollment $enrollment,
        Request $request,
    ): void {
        try {
            $this->auditLogService->resourceEvent(
                'course_enrollment_created',
                'course_enrollment',
                $enrollment->id,
                $request,
                [
                    'user_id' => $user->id,
                    'actor_type' => 'user',
                    'action' => 'enroll',
                    'metadata' => [
                        'course_id' => $course->id,
                        'course_slug' => $course->slug,
                        'course_title' => $course->title,
                        'access_type' => $course->access_type,
                        'enrollment_source' => $enrollment->source,
                        'access_granted' => $enrollment->hasAccess(),
                    ],
                ],
            );
        } catch (Throwable) {
            // Audit failures must never break enrollment.
        }
    }

    protected function recordLearningReward(
        User $user,
        Course $course,
        CourseEnrollment $enrollment,
        Request $request,
    ): void {
        try {
            $reward = $this->rewardService->recordEnrollment(
                $user,
                $course,
                $enrollment,
            );
        } catch (Throwable $exception) {
            try {
                $this->auditLogService->resourceEvent(
                    'course_enrollment_reward_failed',
                    'course_enrollment',
                    $enrollment->id,
                    $request,
                    [
                        'user_id' => $user->id,
                        'actor_type' => 'system',
                        'action' => 'award_enrollment_reward',
                        'metadata' => [
                            'course_id' => $course->id,
                            'error' => $exception->getMessage(),
                        ],
                    ],
                );
            } catch (Throwable) {
                // Keep the enrollment successful even if audit recovery fails.
            }

            return;
        }

        try {
            $this->auditLogService->resourceEvent(
                'course_enrollment_rewarded',
                'course_enrollment',
                $enrollment->id,
                $request,
                [
                    'user_id' => $user->id,
                    'actor_type' => 'system',
                    'action' => 'award_enrollment_reward',
                    'metadata' => [
                        'course_id' => $course->id,
                        'activity_id' => $reward['activity_id'],
                        'achievement_id' => $reward['achievement_id'],
                        'achievement_awarded' => $reward['achievement_awarded'],
                        'points_awarded' => $reward['points_awarded'],
                    ],
                ],
            );
        } catch (Throwable) {
            // Reward succeeded; an audit-only failure must not be reported as a reward failure.
        }
    }

    protected function sendConfirmationEmail(
        User $user,
        Course $course,
        CourseEnrollment $enrollment,
        Request $request,
    ): void {
        try {
            Notification::send(
                $user,
                new CourseEnrollmentNotification(
                    $course,
                    $enrollment,
                ),
            );

            try {
                $this->auditLogService->resourceEvent(
                    'course_enrollment_email_sent',
                    'course_enrollment',
                    $enrollment->id,
                    $request,
                    [
                        'user_id' => $user->id,
                        'actor_type' => 'system',
                        'action' => 'send_enrollment_email',
                        'metadata' => [
                            'course_id' => $course->id,
                            'recipient' => $user->email,
                            'access_granted' => $enrollment->hasAccess(),
                        ],
                    ],
                );
            } catch (Throwable) {
                // Email already succeeded; audit failure remains non-critical.
            }
        } catch (Throwable $exception) {
            try {
                $this->auditLogService->resourceEvent(
                    'course_enrollment_email_failed',
                    'course_enrollment',
                    $enrollment->id,
                    $request,
                    [
                        'user_id' => $user->id,
                        'actor_type' => 'system',
                        'action' => 'send_enrollment_email',
                        'metadata' => [
                            'course_id' => $course->id,
                            'recipient' => $user->email,
                            'error' => $exception->getMessage(),
                        ],
                    ],
                );
            } catch (Throwable) {
                // Neither email nor audit failure may break enrollment.
            }
        }
    }
}
