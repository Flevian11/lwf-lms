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
        Schema::create('achievement_definitions', function (Blueprint $table) {
            $table->id();

            $table->string('name', 120);

            $table->string('slug', 140)
                ->unique();

            $table->text('description');

            $table->string('icon', 120)
                ->nullable();

            $table->unsignedInteger('points')
                ->default(0);

            $table->string('criteria_type', 64);

            $table->json('criteria')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedInteger('sort_order')
                ->default(0);

            $table->timestamps();

            $table->index([
                'is_active',
                'sort_order',
            ], 'achievement_active_order_index');

            $table->index(
                'criteria_type',
                'achievement_criteria_type_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('achievement_definitions');
    }
};