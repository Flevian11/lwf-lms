<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->restrictOnDelete();

            $table->foreignId('module_id')
                ->nullable()
                ->constrained('course_modules')
                ->nullOnDelete();

            $table->foreignId('lesson_id')
                ->nullable()
                ->constrained('lessons')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('title', 200);
            $table->string('slug', 220);

            $table->text('description')->nullable();

            $table->unsignedInteger('time_limit_minutes')
                ->nullable();

            $table->unsignedInteger('passing_score')
                ->default(70);

            $table->unsignedInteger('max_attempts')
                ->nullable();

            $table->boolean('shuffle_questions')
                ->default(false);

            $table->boolean('shuffle_options')
                ->default(false);

            $table->enum('status', [
                'draft',
                'published',
                'closed',
            ])->default('draft')->index();

            $table->timestamp('available_from')->nullable();
            $table->timestamp('due_at')->nullable();

            $table->timestamps();

            $table->unique([
                'course_id',
                'slug',
            ]);

            $table->index([
                'course_id',
                'status',
            ]);

            $table->index([
                'status',
                'due_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};