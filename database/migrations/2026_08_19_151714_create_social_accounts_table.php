<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the external social authentication accounts table.
     */
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('provider', 32);

            $table->string('provider_id');

            $table->string('provider_email')->nullable();

            $table->string('provider_name')->nullable();

            $table->string('provider_avatar_url', 2048)->nullable();

            $table->text('access_token')->nullable();

            $table->text('refresh_token')->nullable();

            $table->timestamp('token_expires_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['provider', 'provider_id'],
                'social_accounts_provider_provider_id_unique'
            );

            $table->index('user_id');
            $table->index('provider');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};