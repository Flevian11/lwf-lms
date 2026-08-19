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

    /**
     * External authentication accounts linked to this user.
     *
     * @return HasMany<SocialAccount>
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * Email two-factor authentication codes.
     *
     * @return HasMany<EmailTwoFactorCode>
     */
    public function emailTwoFactorCodes(): HasMany
    {
        return $this->hasMany(EmailTwoFactorCode::class);
    }

    /**
     * Learning interests selected by the student.
     *
     * @return BelongsToMany<LearningInterest>
     */
    public function learningInterests(): BelongsToMany
    {
        return $this->belongsToMany(
            LearningInterest::class,
            'user_learning_interests'
        );
    }

    /**
     * Send the branded email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification());
    }

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