<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'module_id',
        'lesson_id',
        'created_by',
        'title',
        'slug',
        'instructions',
        'max_points',
        'available_from',
        'due_at',
        'submission_type',
        'max_file_size_mb',
        'allowed_file_types',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'max_points' => 'integer',
            'available_from' => 'datetime',
            'due_at' => 'datetime',
            'max_file_size_mb' => 'integer',
            'allowed_file_types' => 'array',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }
}