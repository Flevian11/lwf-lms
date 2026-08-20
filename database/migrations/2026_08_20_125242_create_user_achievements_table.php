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
        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('achievement_id')
                ->constrained('achievement_definitions')
                ->cascadeOnDelete();

            $table->unsignedInteger('points_awarded')
                ->default(0);

            $table->json('metadata')
                ->nullable();

            $table->timestamp('earned_at');

            $table->timestamps();

            $table->unique([
                'user_id',
                'achievement_id',
            ], 'user_achievement_unique');

            $table->index([
                'user_id',
                'earned_at',
            ], 'user_achievement_earned_index');

            $table->index([
                'achievement_id',
                'earned_at',
            ], 'achievement_earned_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_achievements');
    }
};