<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AuditReportService
{
    /**
     * Return the main audit/reporting dashboard data.
     */
    public function getOverview(?int $days = 30): array
    {
        $days = max(1, min($days ?? 30, 365));

        $from = now()->subDays($days);

        return [
            'period' => [
                'days' => $days,
                'from' => $from,
                'to' => now(),
            ],

            'summary' => $this->summary($from),

            'activity_over_time' => $this->activityOverTime($from),

            'top_pages' => $this->topPages($from),

            'top_ips' => $this->topIps($from),

            'devices' => $this->devices($from),

            'browsers' => $this->browsers($from),

            'platforms' => $this->platforms($from),

            'actors' => $this->actors($from),

            'recent_activity' => $this->recentActivity(),
        ];
    }

    /**
     * High-level audit statistics.
     */
    protected function summary($from): array
    {
        $base = AuditLog::query()
            ->where('occurred_at', '>=', $from);

        $totalVisits = (clone $base)
            ->where('event_type', 'page_view')
            ->count();

        $authenticatedVisits = (clone $base)
            ->where('event_type', 'page_view')
            ->where('actor_type', 'user')
            ->count();

        $guestVisits = (clone $base)
            ->where('event_type', 'page_view')
            ->where('actor_type', 'guest')
            ->count();

        $uniqueIps = (clone $base)
            ->whereNotNull('ip_address')
            ->distinct('ip_address')
            ->count('ip_address');

        $uniqueUsers = (clone $base)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        $uniqueSessions = (clone $base)
            ->whereNotNull('session_id')
            ->distinct('session_id')
            ->count('session_id');

        return [
            'total_events' => (clone $base)->count(),
            'total_page_views' => $totalVisits,
            'authenticated_page_views' => $authenticatedVisits,
            'guest_page_views' => $guestVisits,
            'unique_ips' => $uniqueIps,
            'unique_users' => $uniqueUsers,
            'unique_sessions' => $uniqueSessions,
        ];
    }

    /**
     * Daily activity totals.
     */
    protected function activityOverTime($from): Collection
    {
        return AuditLog::query()
            ->selectRaw('DATE(occurred_at) as date')
            ->selectRaw('COUNT(*) as total_events')
            ->selectRaw(
                "SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views"
            )
            ->selectRaw(
                "SUM(CASE WHEN actor_type = 'user' THEN 1 ELSE 0 END) as authenticated_events"
            )
            ->selectRaw(
                "SUM(CASE WHEN actor_type = 'guest' THEN 1 ELSE 0 END) as guest_events"
            )
            ->where('occurred_at', '>=', $from)
            ->groupByRaw('DATE(occurred_at)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'total_events' => (int) $row->total_events,
                'page_views' => (int) $row->page_views,
                'authenticated_events' => (int) $row->authenticated_events,
                'guest_events' => (int) $row->guest_events,
            ]);
    }

    /**
     * Most visited routes/pages.
     */
    protected function topPages($from, int $limit = 10): Collection
    {
        return AuditLog::query()
            ->select('path', 'route_name')
            ->selectRaw('COUNT(*) as visits')
            ->where('event_type', 'page_view')
            ->where('occurred_at', '>=', $from)
            ->groupBy('path', 'route_name')
            ->orderByDesc('visits')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'path' => $row->path,
                'route_name' => $row->route_name,
                'visits' => (int) $row->visits,
            ]);
    }

    /**
     * Most active IP addresses.
     */
    protected function topIps($from, int $limit = 10): Collection
    {
        return AuditLog::query()
            ->select('ip_address')
            ->selectRaw('COUNT(*) as events')
            ->selectRaw(
                "SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views"
            )
            ->where('occurred_at', '>=', $from)
            ->whereNotNull('ip_address')
            ->groupBy('ip_address')
            ->orderByDesc('events')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'ip_address' => $row->ip_address,
                'events' => (int) $row->events,
                'page_views' => (int) $row->page_views,
            ]);
    }

    /**
     * Device breakdown.
     */
    protected function devices($from): Collection
    {
        return AuditLog::query()
            ->select('device_type')
            ->selectRaw('COUNT(*) as events')
            ->where('occurred_at', '>=', $from)
            ->whereNotNull('device_type')
            ->groupBy('device_type')
            ->orderByDesc('events')
            ->get()
            ->map(fn ($row) => [
                'device_type' => $row->device_type,
                'events' => (int) $row->events,
            ]);
    }

    /**
     * Browser breakdown.
     */
    protected function browsers($from): Collection
    {
        return AuditLog::query()
            ->select('browser')
            ->selectRaw('COUNT(*) as events')
            ->where('occurred_at', '>=', $from)
            ->whereNotNull('browser')
            ->groupBy('browser')
            ->orderByDesc('events')
            ->get()
            ->map(fn ($row) => [
                'browser' => $row->browser,
                'events' => (int) $row->events,
            ]);
    }

    /**
     * Platform/operating-system breakdown.
     */
    protected function platforms($from): Collection
    {
        return AuditLog::query()
            ->select('platform')
            ->selectRaw('COUNT(*) as events')
            ->where('occurred_at', '>=', $from)
            ->whereNotNull('platform')
            ->groupBy('platform')
            ->orderByDesc('events')
            ->get()
            ->map(fn ($row) => [
                'platform' => $row->platform,
                'events' => (int) $row->events,
            ]);
    }

    /**
     * Guest vs authenticated activity.
     */
    protected function actors($from): Collection
    {
        return AuditLog::query()
            ->select('actor_type')
            ->selectRaw('COUNT(*) as events')
            ->where('occurred_at', '>=', $from)
            ->groupBy('actor_type')
            ->orderByDesc('events')
            ->get()
            ->map(fn ($row) => [
                'actor_type' => $row->actor_type,
                'events' => (int) $row->events,
            ]);
    }

    /**
     * Latest audit activity.
     */
    protected function recentActivity(int $limit = 20): Collection
    {
        return AuditLog::query()
            ->with([
                'user:id,name,email',
            ])
            ->latest('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user' => $log->user
                    ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                    ]
                    : null,
                'actor_type' => $log->actor_type,
                'event_type' => $log->event_type,
                'action' => $log->action,
                'route_name' => $log->route_name,
                'path' => $log->path,
                'method' => $log->method,
                'status_code' => $log->status_code,
                'ip_address' => $log->ip_address,
                'device_type' => $log->device_type,
                'device_name' => $log->device_name,
                'browser' => $log->browser,
                'browser_version' => $log->browser_version,
                'platform' => $log->platform,
                'platform_version' => $log->platform_version,
                'resource_type' => $log->resource_type,
                'resource_id' => $log->resource_id,
                'metadata' => $log->metadata,
                'occurred_at' => $log->occurred_at,
            ]);
    }
}