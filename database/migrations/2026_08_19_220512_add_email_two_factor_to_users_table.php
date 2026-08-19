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
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('email_two_factor_enabled')
                ->default(false)
                ->after('onboarding_completed_at');

            $table->timestamp('email_two_factor_enabled_at')
                ->nullable()
                ->after('email_two_factor_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'email_two_factor_enabled',
                'email_two_factor_enabled_at',
            ]);
        });
    }
};