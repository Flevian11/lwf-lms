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
        Schema::create('student_streaks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedInteger('current_streak_days')
                ->default(0);

            $table->unsignedInteger('longest_streak_days')
                ->default(0);

            $table->date('current_streak_started_on')
                ->nullable();

            $table->date('last_activity_on')
                ->nullable();

            $table->date('longest_streak_started_on')
                ->nullable();

            $table->date('longest_streak_ended_on')
                ->nullable();

            $table->timestamps();

            $table->index(
                'last_activity_on',
                'student_streak_last_activity_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_streaks');
    }
};