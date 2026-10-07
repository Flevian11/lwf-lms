<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

trait SendsNotificationsSafely
{
    /**
     * Send a notification, catching every failure so the calling flow
     * (grading, progress marking, etc.) is never interrupted by mail
     * problems. Failures are logged at warning level.
     */
    protected function safeNotify(
        mixed $notifiables,
        object $notification,
        array $context = [],
    ): bool {
        try {
            Notification::send($notifiables, $notification);

            return true;
        } catch (\Throwable $e) {
            Log::warning('Notification send failed; flow continues.', array_merge([
                'notification'   => get_class($notification),
                'error'          => $e->getMessage(),
                'notifiable_ids' => $this->extractNotifiableIds($notifiables),
            ], $context));

            return false;
        }
    }

    private function extractNotifiableIds(mixed $notifiables): array
    {
        if ($notifiables instanceof EloquentCollection || $notifiables instanceof Collection) {
            return $notifiables->pluck('id')->all();
        }

        if (is_object($notifiables) && isset($notifiables->id)) {
            return [$notifiables->id];
        }

        if (is_array($notifiables)) {
            return array_values(array_filter(array_map(
                fn ($n) => is_object($n) ? ($n->id ?? null) : null,
                $notifiables,
            )));
        }

        return [];
    }
}