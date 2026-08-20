<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAchievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'achievement_id',
        'points_awarded',
        'metadata',
        'earned_at',
    ];

    protected function casts(): array
    {
        return [
            'points_awarded' => 'integer',
            'metadata' => 'array',
            'earned_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function achievement(): BelongsTo
    {
        return $this->belongsTo(
            AchievementDefinition::class,
            'achievement_id'
        );
    }
}