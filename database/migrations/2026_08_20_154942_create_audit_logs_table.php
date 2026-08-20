<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            /*
             * Actor
             *
             * user_id remains nullable because guests must also be
             * represented in the audit trail.
             */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('actor_type', [
                'guest',
                'user',
                'system',
            ])->default('guest');

            /*
             * Laravel database session.
             *
             * We deliberately do not create a foreign key to sessions.id
             * because Laravel can remove expired session records while
             * historical audit records must remain intact.
             */
            $table->string('session_id', 255)->nullable();

            /*
             * Event classification.
             *
             * Examples:
             * page_view
             * login
             * logout
             * session_created
             * session_revoked
             * password_changed
             * passkey_registered
             * passkey_removed
             * two_factor_enabled
             * two_factor_disabled
             * assignment_submitted
             * quiz_started
             * quiz_completed
             * payment_created
             * payment_completed
             */
            $table->string('event_type', 80);

            /*
             * Human/system-readable action.
             */
            $table->string('action', 120)->nullable();

            /*
             * Request information.
             */
            $table->string('route_name', 180)->nullable();
            $table->string('path', 500)->nullable();
            $table->string('method', 10)->nullable();
            $table->unsignedSmallInteger('status_code')->nullable();

            /*
             * Request/device information.
             */
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->string('device_type', 40)->nullable();
            $table->string('device_name', 120)->nullable();
            $table->string('browser', 80)->nullable();
            $table->string('browser_version', 40)->nullable();
            $table->string('platform', 80)->nullable();
            $table->string('platform_version', 40)->nullable();

            /*
             * Geographic information.
             *
             * These values should only be populated from a trusted
             * geolocation provider/service when available.
             */
            $table->string('country_code', 2)->nullable();
            $table->string('country_name', 100)->nullable();
            $table->string('region', 120)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('locality', 160)->nullable();

            /*
             * Optional resource context.
             *
             * Example:
             * resource_type = Course
             * resource_id   = 15
             */
            $table->string('resource_type', 100)->nullable();
            $table->unsignedBigInteger('resource_id')->nullable();

            /*
             * Flexible structured information.
             *
             * Never store passwords, OTP codes, secrets, tokens,
             * session payloads, or other sensitive authentication data.
             */
            $table->json('metadata')->nullable();

            /*
             * Timestamp of the actual event.
             */
            $table->timestamp('occurred_at');

            $table->timestamps();

            /*
             * Primary reporting indexes.
             */
            $table->index(
                ['user_id', 'occurred_at'],
                'audit_user_time_index'
            );

            $table->index(
                ['actor_type', 'occurred_at'],
                'audit_actor_time_index'
            );

            $table->index(
                ['event_type', 'occurred_at'],
                'audit_event_time_index'
            );

            $table->index(
                ['route_name', 'occurred_at'],
                'audit_route_time_index'
            );

            $table->index(
                ['path', 'occurred_at'],
                'audit_path_time_index'
            );

            $table->index(
                ['ip_address', 'occurred_at'],
                'audit_ip_time_index'
            );

            $table->index(
                ['device_type', 'occurred_at'],
                'audit_device_time_index'
            );

            $table->index(
                ['browser', 'occurred_at'],
                'audit_browser_time_index'
            );

            $table->index(
                ['platform', 'occurred_at'],
                'audit_platform_time_index'
            );

            $table->index(
                ['country_code', 'city', 'occurred_at'],
                'audit_location_time_index'
            );

            $table->index(
                ['resource_type', 'resource_id', 'occurred_at'],
                'audit_resource_time_index'
            );

            $table->index(
                ['session_id', 'occurred_at'],
                'audit_session_time_index'
            );

            $table->index(
                ['occurred_at'],
                'audit_occurred_at_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};