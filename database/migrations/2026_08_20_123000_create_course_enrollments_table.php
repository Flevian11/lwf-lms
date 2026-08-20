<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->restrictOnDelete();

            $table->enum('status', [
                'active',
                'completed',
                'paused',
                'cancelled',
            ])->default('active')->index();

            $table->timestamp('enrolled_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->unique([
                'user_id',
                'course_id',
            ]);

            $table->index([
                'user_id',
                'status',
            ]);

            $table->index([
                'course_id',
                'status',
            ]);

            $table->index([
                'status',
                'completed_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_enrollments');
    }
};