<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_materials', function (Blueprint $table) {
            $table->id();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignId('module_id')
                ->nullable()
                ->constrained('course_modules')
                ->cascadeOnDelete();

            $table->foreignId('lesson_id')
                ->nullable()
                ->constrained('lessons')
                ->cascadeOnDelete();

            $table->string('title', 200);

            $table->text('description')
                ->nullable();

            $table->enum('type', [
                'pdf',
                'video',
                'link',
                'document',
                'presentation',
                'audio',
                'other',
            ])->default('other');

            /*
             * External resources such as YouTube, Vimeo,
             * documentation sites, articles, etc.
             */
            $table->text('url')
                ->nullable();

            /*
             * Internal uploaded resources such as PDFs,
             * documents, presentations and audio.
             */
            $table->string('file_path')
                ->nullable();

            $table->string('mime_type', 150)
                ->nullable();

            /*
             * Preview materials remain accessible before
             * the student receives full course access.
             */
            $table->boolean('is_preview')
                ->default(false);

            $table->unsignedInteger('position')
                ->default(1);

            $table->enum('status', [
                'draft',
                'published',
                'archived',
            ])->default('draft');

            /*
             * Optional provider/resource metadata.
             *
             * Examples:
             * {
             *   "provider": "youtube",
             *   "video_id": "..."
             * }
             */
            $table->json('metadata')
                ->nullable();

            $table->timestamps();

            $table->index([
                'course_id',
                'status',
                'position',
            ]);

            $table->index([
                'module_id',
                'status',
                'position',
            ]);

            $table->index([
                'lesson_id',
                'status',
                'position',
            ]);

            $table->index([
                'course_id',
                'is_preview',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_materials');
    }
};