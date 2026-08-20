<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();

            $table->foreignId('module_id')
                ->constrained('course_modules')
                ->cascadeOnDelete();

            $table->string('title', 200);
            $table->string('slug', 220);

            $table->string('description', 500)->nullable();
            $table->longText('content')->nullable();

            $table->enum('type', [
                'article',
                'video',
                'document',
                'interactive',
            ])->default('article');

            $table->unsignedInteger('position');

            $table->unsignedInteger('duration_minutes')
                ->nullable();

            $table->enum('status', [
                'draft',
                'published',
            ])->default('draft')->index();

            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            $table->unique([
                'module_id',
                'slug',
            ]);

            $table->unique([
                'module_id',
                'position',
            ]);

            $table->index([
                'module_id',
                'position',
            ]);

            $table->index([
                'status',
                'published_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};