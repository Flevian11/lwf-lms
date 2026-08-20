<?php

namespace App\Services;

use App\Models\AuditLog;
use DeviceDetector\DeviceDetector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class AuditLogService
{
    public function record(
        string $eventType,
        ?Request $request = null,
        array $attributes = [],
    ): AuditLog {
        $request ??= request();

        $user = $request->user() ?? Auth::user();

        $userAgent = $attributes['user_agent']
            ?? $request->userAgent();

        $device = $this->detectDevice($userAgent);

        $actorType = $attributes['actor_type']
            ?? ($user !== null ? 'user' : 'guest');

        return AuditLog::create([
            'user_id' => $attributes['user_id'] ?? $user?->id,
            'actor_type' => $actorType,

            'session_id' => $attributes['session_id']
                ?? $this->sessionId($request),

            'event_type' => $eventType,
            'action' => $attributes['action'] ?? null,

            'route_name' => $attributes['route_name']
                ?? $request->route()?->getName(),

            'path' => $attributes['path']
                ?? $request->path(),

            'method' => $attributes['method']
                ?? $request->method(),

            'status_code' => $attributes['status_code'] ?? null,

            'ip_address' => $attributes['ip_address']
                ?? $request->ip(),

            'user_agent' => $userAgent,

            'device_type' => $attributes['device_type']
                ?? $device['device_type'],

            'device_name' => $attributes['device_name']
                ?? $device['device_name'],

            'browser' => $attributes['browser']
                ?? $device['browser'],

            'browser_version' => $attributes['browser_version']
                ?? $device['browser_version'],

            'platform' => $attributes['platform']
                ?? $device['platform'],

            'platform_version' => $attributes['platform_version']
                ?? $device['platform_version'],

            'country_code' => $attributes['country_code'] ?? null,
            'country_name' => $attributes['country_name'] ?? null,
            'region' => $attributes['region'] ?? null,
            'city' => $attributes['city'] ?? null,
            'locality' => $attributes['locality'] ?? null,

            'resource_type' => $attributes['resource_type'] ?? null,
            'resource_id' => $attributes['resource_id'] ?? null,

            'metadata' => $attributes['metadata'] ?? null,

            'occurred_at' => $attributes['occurred_at'] ?? now(),
        ]);
    }

    public function pageView(
        Request $request,
        array $attributes = [],
    ): AuditLog {
        return $this->record(
            'page_view',
            $request,
            $attributes,
        );
    }

    public function securityEvent(
        string $eventType,
        ?Request $request = null,
        array $attributes = [],
    ): AuditLog {
        return $this->record(
            $eventType,
            $request,
            $attributes,
        );
    }

    public function userEvent(
        string $eventType,
        ?Request $request = null,
        array $attributes = [],
    ): AuditLog {
        $user = $request?->user() ?? Auth::user();

        return $this->record(
            $eventType,
            $request,
            array_merge(
                [
                    'user_id' => $user?->id,
                    'actor_type' => $user !== null ? 'user' : 'guest',
                ],
                $attributes,
            ),
        );
    }

    public function systemEvent(
        string $eventType,
        ?Request $request = null,
        array $attributes = [],
    ): AuditLog {
        return $this->record(
            $eventType,
            $request,
            array_merge(
                [
                    'actor_type' => 'system',
                    'user_id' => null,
                ],
                $attributes,
            ),
        );
    }

    public function resourceEvent(
        string $eventType,
        string $resourceType,
        int $resourceId,
        ?Request $request = null,
        array $attributes = [],
    ): AuditLog {
        return $this->record(
            $eventType,
            $request,
            array_merge(
                [
                    'resource_type' => $resourceType,
                    'resource_id' => $resourceId,
                ],
                $attributes,
            ),
        );
    }

    /**
     * Parse browser, operating system and device information.
     *
     * The detector works entirely from the request's user-agent and
     * does not require an external API.
     */
    protected function detectDevice(?string $userAgent): array
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
            $detector = new DeviceDetector($userAgent);

            $detector->parse();

            $client = $detector->getClient();
            $os = $detector->getOs();

            $deviceType = $detector->getDeviceName();

            return [
                'device_type' => $this->normaliseDeviceType(
                    $deviceType,
                ),

                'device_name' => $detector->getModel()
                    ?: null,

                'browser' => $client['name']
                    ?? null,

                'browser_version' => $client['version']
                    ?? null,

                'platform' => $os['name']
                    ?? null,

                'platform_version' => $this->platformVersion($os),
            ];
        } catch (Throwable) {
            return $empty;
        }
    }

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
            default => strtolower(str_replace(' ', '_', $deviceType)),
        };
    }

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

    protected function sessionId(Request $request): ?string
    {
        try {
            if (! $request->hasSession()) {
                return null;
            }

            return $request->session()->getId() ?: null;
        } catch (Throwable) {
            return null;
        }
    }
}