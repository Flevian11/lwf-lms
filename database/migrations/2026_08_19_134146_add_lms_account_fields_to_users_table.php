<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add LMS-specific account fields to the users table.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('status', 32)
                ->default('active')
                ->after('password');

            $table->string('avatar_path')
                ->nullable()
                ->after('status');

            $table->timestamp('last_login_at')
                ->nullable()
                ->after('avatar_path');

            $table->ipAddress('last_login_ip')
                ->nullable()
                ->after('last_login_at');

            $table->string('timezone', 64)
                ->default('UTC')
                ->after('last_login_ip');

            $table->string('locale', 16)
                ->default('en')
                ->after('timezone');

            $table->index('status');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['status']);

            $table->dropColumn([
                'status',
                'avatar_path',
                'last_login_at',
                'last_login_ip',
                'timezone',
                'locale',
            ]);
        });
    }
};