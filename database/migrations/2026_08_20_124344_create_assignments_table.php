<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
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

            $table->text('instructions');

            $table->unsignedInteger('max_points')
                ->default(100);

            $table->timestamp('available_from')->nullable();
            $table->timestamp('due_at')->nullable();

            $table->enum('submission_type', [
                'text',
                'file',
                'text_and_file',
            ])->default('file');

            $table->unsignedInteger('max_file_size_mb')
                ->nullable();

            $table->json('allowed_file_types')
                ->nullable();

            $table->enum('status', [
                'draft',
                'published',
                'closed',
            ])->default('draft')->index();

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
                'module_id',
                'status',
            ]);

            $table->index([
                'lesson_id',
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
        Schema::dropIfExists('assignments');
    }
};