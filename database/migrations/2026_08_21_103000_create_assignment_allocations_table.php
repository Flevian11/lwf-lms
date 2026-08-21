<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assignment_id')
                ->constrained('assignments')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();

            $table->unique(['assignment_id', 'user_id'], 'assignment_allocations_assignment_user_unique');
            $table->index(['user_id', 'assigned_at'], 'assignment_allocations_user_assigned_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_allocations');
    }
};
