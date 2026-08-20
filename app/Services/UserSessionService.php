<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserSessionService
{
    /**
     * Get all active database sessions belonging to a user.
     */
    public function getSessions(User $user, ?string $currentSessionId = null): Collection
    {
        return DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(function ($session) use ($currentSessionId): array {
                $device = $this->parseUserAgent($session->user_agent);

                return [
                    'id' => $session->id,
                    'is_current' => $session->id === $currentSessionId,

                    'ip_address' => $session->ip_address,

                    'device_type' => $device['device_type'],
                    'device_name' => $device['device_name'],

                    'browser' => $device['browser'],
                    'browser_version' => $device['browser_version'],

                    'platform' => $device['platform'],
                    'platform_version' => $device['platform_version'],

                    'last_activity' => $session->last_activity,
                    'last_activity_at' => $this->lastActivityDate(
                        $session->last_activity
                    ),

                    'user_agent' => $session->user_agent,
                ];
            });
    }

    /**
     * Revoke one session.
     *
     * The current session is protected from accidental termination.
     */
    public function revoke(
        User $user,
        string $sessionId,
        ?string $currentSessionId = null,
    ): bool {
        if ($currentSessionId !== null && $sessionId === $currentSessionId) {
            return false;
        }

        return DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', $user->id)
            ->delete() > 0;
    }

    /**
     * Revoke every other session belonging to the user.
     *
     * The currently active session is deliberately preserved.
     */
    public function revokeOtherSessions(
        User $user,
        ?string $currentSessionId = null,
    ): int {
        if ($currentSessionId === null) {
            return 0;
        }

        return DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $currentSessionId)
            ->delete();
    }

    /**
     * Count the user's active database sessions.
     */
    public function count(User $user): int
    {
        return DB::table('sessions')
            ->where('user_id', $user->id)
            ->count();
    }

    /**
     * Determine whether a session belongs to the authenticated user.
     */
    public function belongsToUser(
        User $user,
        string $sessionId,
    ): bool {
        return DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Parse browser/device information.
     */
    protected function parseUserAgent(?string $userAgent): array
    {
        $empty = [
            'device_type' => null,
            'device_name' => null,
            'browser' => null,
            'browser_version' => null,
            'platform' => null,
            'platform_version' => null,
        ];

        if (! $userAgent) {
            return $empty;
        }

        try {
            $detector = new \DeviceDetector\DeviceDetector($userAgent);

            $detector->parse();

            $client = $detector->getClient();
            $os = $detector->getOs();

            return [
                'device_type' => $this->normaliseDeviceType(
                    $detector->getDeviceName()
                ),

                'device_name' => $detector->getModel() ?: null,

                'browser' => $client['name'] ?? null,

                'browser_version' => $client['version'] ?? null,

                'platform' => $os['name'] ?? null,

                'platform_version' => $this->platformVersion($os),
            ];
        } catch (\Throwable) {
            return $empty;
        }
    }

    /**
     * Convert Matomo's device names to our application's terminology.
     */
    protected function normaliseDeviceType(?string $deviceType): ?string
    {
        if (! $deviceType) {
            return null;
        }

        return match (strtolower($deviceType)) {
            'smartphone' => 'mobile',
            'tablet' => 'tablet',
            'desktop' => 'desktop',
            'feature phone' => 'mobile',
            'console' => 'console',
            'tv' => 'tv',
            'car browser' => 'car',
            'smart display' => 'smart_display',
            'camera' => 'camera',
            default => strtolower(
                str_replace(' ', '_', $deviceType)
            ),
        };
    }

    /**
     * Build a readable OS version.
     */
    protected function platformVersion(array $os): ?string
    {
        $parts = array_filter([
            $os['version']['major'] ?? null,
            $os['version']['minor'] ?? null,
            $os['version']['patch'] ?? null,
            $os['version']['patchMinor'] ?? null,
        ], static fn ($value) => $value !== null && $value !== '');

        return $parts !== []
            ? implode('.', $parts)
            : null;
    }

    /**
     * Convert the Laravel session timestamp to a Carbon instance.
     */
    protected function lastActivityDate(?int $timestamp)
    {
        if (! $timestamp) {
            return null;
        }

        return now()->setTimestamp($timestamp)->toISOString();
    }
}