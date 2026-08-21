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

    /**
     * Keep the middleware completely transparent to Laravel/Inertia.
     *
     * Route controllers may return Responsable objects such as
     * Inertia\Response. Laravel converts those to a real HTTP response
     * after the middleware pipeline. We therefore do not inspect or wrap
     * the controller response here.
     */
    public function handle(
        Request $request,
        Closure $next,
    ): mixed {
        return $next($request);
    }

    /**
     * Record the page view after Laravel has finalized the response.
     *
     * At this point the response is a real Symfony response, so Inertia,
     * Fortify and normal Laravel responses are handled uniformly.
     * Audit failures are deliberately isolated from the user request.
     */
    public function terminate(
        Request $request,
        Response $response,
    ): void {
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
                // Audit logging must never break the completed request.
            }
        }
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
