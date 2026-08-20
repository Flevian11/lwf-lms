<?php

namespace App\Http\Controllers;

use App\Services\AuditLogService;
use App\Services\UserSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserSessionController extends Controller
{
    public function __construct(
        protected UserSessionService $userSessionService,
        protected AuditLogService $auditLogService,
    ) {
    }

    /**
     * Revoke one authenticated session/device.
     */
    public function destroy(
        Request $request,
        string $sessionId,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $currentSessionId = $request->session()->getId();

        if ($sessionId === $currentSessionId) {
            return back()->with(
                'error',
                'Your current session cannot be revoked from this device.',
            );
        }

        $revoked = $this->userSessionService->revoke(
            $user,
            $sessionId,
            $currentSessionId,
        );

        if (! $revoked) {
            return back()->with(
                'error',
                'The selected session could not be found or has already been revoked.',
            );
        }

        $this->auditLogService->securityEvent(
            'session_revoked',
            $request,
            [
                'user_id' => $user->id,
                'actor_type' => 'user',
                'metadata' => [
                    'revoked_session_id' => $sessionId,
                ],
            ],
        );

        return back()->with(
            'success',
            'The selected session has been revoked.',
        );
    }

    /**
     * Revoke all authenticated sessions except the current device.
     */
    public function destroyOthers(
        Request $request,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $currentSessionId = $request->session()->getId();

        $revokedCount = $this->userSessionService->revokeOtherSessions(
            $user,
            $currentSessionId,
        );

        $this->auditLogService->securityEvent(
            'other_sessions_revoked',
            $request,
            [
                'user_id' => $user->id,
                'actor_type' => 'user',
                'metadata' => [
                    'revoked_count' => $revokedCount,
                ],
            ],
        );

        return back()->with(
            'success',
            $revokedCount > 0
                ? "{$revokedCount} other session(s) have been revoked."
                : 'There were no other active sessions to revoke.',
        );
    }
}