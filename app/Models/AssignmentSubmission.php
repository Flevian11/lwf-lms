<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'user_id',
        'attempt_number',
        'text_content',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'status',
        'score',
        'feedback',
        'graded_by',
        'submitted_at',
        'graded_at',
        'transcript_path',
        'transcript_generated_at',
    ];

    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'file_size' => 'integer',
            'score' => 'integer',
            'submitted_at' => 'datetime',
            'graded_at' => 'datetime',
            'transcript_generated_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}