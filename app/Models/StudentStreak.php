<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentStreak extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'current_streak_days',
        'longest_streak_days',
        'current_streak_started_on',
        'last_activity_on',
        'longest_streak_started_on',
        'longest_streak_ended_on',
    ];

    protected function casts(): array
    {
        return [
            'current_streak_days' => 'integer',
            'longest_streak_days' => 'integer',
            'current_streak_started_on' => 'date',
            'last_activity_on' => 'date',
            'longest_streak_started_on' => 'date',
            'longest_streak_ended_on' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}