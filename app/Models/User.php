<?php

namespace App\Models;

use App\Enums\UserStatus;
use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\PasskeyAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'name',
    'email',
    'password',
    'status',
    'avatar_path',
    'timezone',
    'locale',
    'onboarding_completed_at',
    'email_two_factor_enabled',
    'email_two_factor_enabled_at',
])]
#[Hidden([
    'password',
    'remember_token',
    'two_factor_secret',
    'two_factor_recovery_codes',
])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;
    use Notifiable;
    use HasRoles;
    use TwoFactorAuthenticatable;
    use PasskeyAuthenticatable;

    /**
     * Spatie Permission guard.
     */
    protected string $guard_name = 'web';

    /*
    |--------------------------------------------------------------------------
    | Authentication / External Accounts
    |--------------------------------------------------------------------------
    */

    /**
     * External authentication accounts linked to this user.
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * Email two-factor authentication codes.
     */
    public function emailTwoFactorCodes(): HasMany
    {
        return $this->hasMany(EmailTwoFactorCode::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Learning Profile
    |--------------------------------------------------------------------------
    */

    /**
     * Learning interests selected by the student.
     */
    public function learningInterests(): BelongsToMany
    {
        return $this->belongsToMany(
            LearningInterest::class,
            'user_learning_interests',
            'user_id',
            'learning_interest_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Courses
    |--------------------------------------------------------------------------
    */

    /**
     * Course enrollments belonging to this user.
     */
    public function courseEnrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    /**
     * Courses the user is enrolled in.
     */
    public function enrolledCourses(): BelongsToMany
    {
        return $this->belongsToMany(
            Course::class,
            'course_enrollments',
            'user_id',
            'course_id'
        )->withPivot([
            'id',
            'source',
            'payment_id',
            'approved_by',
            'approved_at',
            'access_granted_at',
            'status',
            'enrolled_at',
            'started_at',
            'completed_at',
        ])->withTimestamps();
    }

    /**
     * Courses created by this user.
     *
     * Primarily used by administrators/instructors.
     */
    public function createdCourses(): HasMany
    {
        return $this->hasMany(
            Course::class,
            'created_by'
        );
    }

    /**
     * Course enrollments approved by this user.
     */
    public function approvedCourseEnrollments(): HasMany
    {
        return $this->hasMany(
            CourseEnrollment::class,
            'approved_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Lesson Progress
    |--------------------------------------------------------------------------
    */

    /**
     * Lesson progress records belonging to this user.
     */
    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Assignments
    |--------------------------------------------------------------------------
    */

    /**
     * Assignments created by this user.
     */
    public function createdAssignments(): HasMany
    {
        return $this->hasMany(
            Assignment::class,
            'created_by'
        );
    }

    /**
     * Assignment submissions made by this user.
     */
    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    /**
     * Assignment submissions graded by this user.
     */
    public function gradedAssignmentSubmissions(): HasMany
    {
        return $this->hasMany(
            AssignmentSubmission::class,
            'graded_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Quizzes
    |--------------------------------------------------------------------------
    */

    /**
     * Quizzes created by this user.
     */
    public function createdQuizzes(): HasMany
    {
        return $this->hasMany(
            Quiz::class,
            'created_by'
        );
    }

    /**
     * Quiz attempts made by this user.
     */
    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Learning Activity / Analytics
    |--------------------------------------------------------------------------
    */

    /**
     * Event-level learning activity generated by this user.
     *
     * Used for:
     * - weekly progress
     * - activity history
     * - analytics
     * - points
     * - streak calculations
     * - recommendation signals
     * - future AI context
     */
    public function learningActivities(): HasMany
    {
        return $this->hasMany(
            StudentLearningActivity::class
        );
    }

    /**
     * Student learning streak.
     */
    public function studentStreak(): HasOne
    {
        return $this->hasOne(StudentStreak::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Achievements / Gamification
    |--------------------------------------------------------------------------
    */

    /**
     * Achievements earned by this user.
     *
     * This is the canonical relationship used by the
     * dashboard service.
     */
    public function achievements(): HasMany
    {
        return $this->hasMany(
            UserAchievement::class
        );
    }

    /**
     * Explicit alias for accessing the underlying
     * user achievement records.
     */
    public function userAchievements(): HasMany
    {
        return $this->hasMany(
            UserAchievement::class
        );
    }

    /**
     * Point transactions belonging to this user.
     */
    public function pointTransactions(): HasMany
    {
        return $this->hasMany(
            PointTransaction::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Payments
    |--------------------------------------------------------------------------
    */

    /**
     * Payments initiated by this user.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    /**
     * Send the branded email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(
            new VerifyEmailNotification()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Account State
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user has completed onboarding.
     */
    public function hasCompletedOnboarding(): bool
    {
        return $this->onboarding_completed_at !== null;
    }

    /**
     * Determine whether email 2FA is enabled.
     */
    public function hasEmailTwoFactorEnabled(): bool
    {
        return (bool) $this->email_two_factor_enabled;
    }

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    /**
     * Attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
            'last_login_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
            'email_two_factor_enabled' => 'boolean',
            'email_two_factor_enabled_at' => 'datetime',
        ];
    }
}