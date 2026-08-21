<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'attempt_number',
        'status',
        'score',
        'max_score',
        'percentage',
        'passed',
        'started_at',
        'submitted_at',
        'graded_at',
        'expires_at',
        'violation_count',
        'last_autosaved_at',
        'auto_submitted_at',
        'termination_reason',
    ];

    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'score' => 'integer',
            'max_score' => 'integer',
            'percentage' => 'decimal:2',
            'passed' => 'boolean',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'graded_at' => 'datetime',
            'expires_at' => 'datetime',
            'violation_count' => 'integer',
            'last_autosaved_at' => 'datetime',
            'auto_submitted_at' => 'datetime',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAnswer::class, 'attempt_id');
    }

    public function violations(): HasMany
    {
        return $this->hasMany(QuizAttemptViolation::class, 'attempt_id')->orderBy('sequence');
    }
}