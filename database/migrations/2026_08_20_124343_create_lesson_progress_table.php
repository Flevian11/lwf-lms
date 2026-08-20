<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('lesson_id')
                ->constrained('lessons')
                ->cascadeOnDelete();

            $table->enum('status', [
                'not_started',
                'in_progress',
                'completed',
            ])->default('not_started')->index();

            $table->unsignedTinyInteger('progress_percent')
                ->default(0);

            $table->unsignedInteger('time_spent_seconds')
                ->default(0);

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_accessed_at')->nullable();

            $table->timestamps();

            $table->unique([
                'user_id',
                'lesson_id',
            ]);

            $table->index([
                'user_id',
                'status',
            ]);

            $table->index([
                'lesson_id',
                'status',
            ]);

            $table->index([
                'user_id',
                'last_accessed_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};