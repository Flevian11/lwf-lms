<?php

namespace App\Http\Middleware;

use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class TrackAuditActivity
{
    public function __construct(
        protected AuditLogService $auditLogService,
    ) {
    }

    public function handle(
        Request $request,
        Closure $next,
    ): Response {
        $response = $next($request);

        /*
         * Only audit successful/normal web requests.
         *
         * We intentionally skip:
         * - asset requests
         * - Vite development requests
         * - prefetch requests
         * - non-GET requests
         *
         * Security/business events such as login, logout, payments,
         * submissions and session revocation will be recorded explicitly
         * by their respective application services/controllers.
         */
        if (
            $request->isMethod('GET')
            && $this->shouldTrack($request, $response)
        ) {
            try {
                $this->auditLogService->pageView(
                    $request,
                    [
                        'status_code' => $response->getStatusCode(),
                        'metadata' => [
                            'inertia' => $request->header('X-Inertia') !== null,
                            'inertia_version' => $request->header('X-Inertia-Version'),
                            'referer' => $this->truncate(
                                $request->headers->get('referer'),
                                500,
                            ),
                        ],
                    ],
                );
            } catch (Throwable) {
                /*
                 * Audit logging must never break the user's request.
                 *
                 * The application response has already been generated,
                 * so an audit failure is deliberately isolated here.
                 */
            }
        }

        return $response;
    }

    protected function shouldTrack(
        Request $request,
        Response $response,
    ): bool {
        if ($response->getStatusCode() >= 400) {
            return false;
        }

        if ($request->expectsJson()) {
            return false;
        }

        if ($request->ajax()) {
            return false;
        }

        if ($request->header('Purpose') === 'prefetch') {
            return false;
        }

        if ($request->header('Sec-Purpose') === 'prefetch') {
            return false;
        }

        if ($request->is('build/*')) {
            return false;
        }

        if ($request->is('storage/*')) {
            return false;
        }

        if ($request->is('favicon.ico')) {
            return false;
        }

        return true;
    }

    protected function truncate(
        ?string $value,
        int $length,
    ): ?string {
        if ($value === null || $value === '') {
            return null;
        }

        return mb_substr($value, 0, $length);
    }
}