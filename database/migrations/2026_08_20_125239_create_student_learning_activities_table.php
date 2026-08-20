<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_learning_activities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->nullable()
                ->constrained('courses')
                ->nullOnDelete();

            $table->foreignId('lesson_id')
                ->nullable()
                ->constrained('lessons')
                ->nullOnDelete();

            $table->foreignId('assignment_id')
                ->nullable()
                ->constrained('assignments')
                ->nullOnDelete();

            $table->foreignId('quiz_id')
                ->nullable()
                ->constrained('quizzes')
                ->nullOnDelete();

            $table->string('activity_type', 64);

            $table->unsignedInteger('points')
                ->default(0);

            $table->json('metadata')
                ->nullable();

            $table->timestamp('occurred_at');

            $table->timestamps();

            $table->index([
                'user_id',
                'occurred_at',
            ]);

            $table->index([
                'user_id',
                'activity_type',
                'occurred_at',
            ], 'student_activity_user_type_time_index');

            $table->index([
                'course_id',
                'activity_type',
                'occurred_at',
            ], 'student_activity_course_type_time_index');

            $table->index([
                'assignment_id',
                'occurred_at',
            ], 'student_activity_assignment_time_index');

            $table->index([
                'quiz_id',
                'occurred_at',
            ], 'student_activity_quiz_time_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_learning_activities');
    }
};