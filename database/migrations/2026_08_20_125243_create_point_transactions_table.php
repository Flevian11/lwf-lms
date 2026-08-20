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
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('type', 64);

            $table->integer('points');

            $table->string('description', 255);

            $table->foreignId('course_id')
                ->nullable()
                ->constrained('courses')
                ->nullOnDelete();

            $table->foreignId('assignment_id')
                ->nullable()
                ->constrained('assignments')
                ->nullOnDelete();

            $table->foreignId('quiz_id')
                ->nullable()
                ->constrained('quizzes')
                ->nullOnDelete();

            $table->foreignId('achievement_id')
                ->nullable()
                ->constrained('achievement_definitions')
                ->nullOnDelete();

            $table->json('metadata')
                ->nullable();

            $table->timestamp('awarded_at');

            $table->timestamps();

            $table->index([
                'user_id',
                'awarded_at',
            ]);

            $table->index([
                'user_id',
                'type',
                'awarded_at',
            ], 'points_user_type_time_index');

            $table->index([
                'course_id',
                'awarded_at',
            ], 'points_course_time_index');

            $table->index([
                'assignment_id',
                'awarded_at',
            ], 'points_assignment_time_index');

            $table->index([
                'quiz_id',
                'awarded_at',
            ], 'points_quiz_time_index');

            $table->index([
                'achievement_id',
                'awarded_at',
            ], 'points_achievement_time_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};