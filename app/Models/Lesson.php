<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'slug',
        'description',
        'content',
        'type',
        'position',
        'is_preview',
        'duration_minutes',
        'status',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_preview' => 'boolean',
            'duration_minutes' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(
            CourseModule::class,
            'module_id'
        );
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function materials(): HasMany
{
    return $this->hasMany(CourseMaterial::class)
        ->orderBy('position');
}
}