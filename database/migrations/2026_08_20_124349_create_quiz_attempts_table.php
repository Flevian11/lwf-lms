<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('quiz_id')
                ->constrained('quizzes')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedInteger('attempt_number');

            $table->enum('status', [
                'in_progress',
                'submitted',
                'graded',
                'abandoned',
            ])->default('in_progress')->index();

            $table->unsignedInteger('score')
                ->nullable();

            $table->unsignedInteger('max_score')
                ->nullable();

            $table->decimal('percentage', 5, 2)
                ->nullable();

            $table->boolean('passed')
                ->nullable();

            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['quiz_id', 'user_id', 'attempt_number'],
                'quiz_attempt_unique'
            );

            $table->index([
                'user_id',
                'status',
            ]);

            $table->index([
                'quiz_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};