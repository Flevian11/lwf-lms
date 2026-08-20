<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assignment_id')
                ->constrained('assignments')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedInteger('attempt_number')
                ->default(1);

            $table->longText('text_content')
                ->nullable();

            $table->string('file_path')
                ->nullable();

            $table->string('original_filename')
                ->nullable();

            $table->string('mime_type', 150)
                ->nullable();

            $table->unsignedBigInteger('file_size')
                ->nullable();

            $table->enum('status', [
                'draft',
                'submitted',
                'late',
                'graded',
                'returned',
            ])->default('draft')->index();

            $table->unsignedInteger('score')
                ->nullable();

            $table->text('feedback')
                ->nullable();

            $table->foreignId('graded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['assignment_id', 'user_id', 'attempt_number'],
                'assignment_submission_attempt_unique'
            );

            $table->index([
                'user_id',
                'status',
            ]);

            $table->index([
                'assignment_id',
                'status',
            ]);

            $table->index([
                'graded_by',
                'graded_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
    }
};