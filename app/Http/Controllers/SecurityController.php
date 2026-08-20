<?php

namespace App\Http\Controllers;

use App\Services\AuditLogService;
use App\Services\UserSessionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    public function __construct(
        protected UserSessionService $userSessionService,
    ) {
    }

    /**
     * Display the authenticated user's security settings.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $currentSessionId = $request->session()->getId();

        return Inertia::render('Security', [
            /*
             * Keep the security-specific user payload.
             *
             * avatar_path is important because StudentLayout uses the
             * same student identity contract as Dashboard/Profile/Support.
             */
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'role' => $user->getRoleNames()->first() ?? 'Student',
            ],

            /*
             * Supply the exact same student identity contract used by
             * Dashboard, Profile and Support.
             */
            'student' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'timezone' => $user->timezone ?? 'Africa/Nairobi',
                'locale' => $user->locale ?? 'en',
            ],

            /*
             * StudentLayout expects DashboardStats.
             *
             * Keep the security page lightweight rather than loading the
             * entire dashboard dataset. These values are only used by the
             * shared sidebar on this page.
             */
            'stats' => [
                'courses' => [
                    'total' => 0,
                    'active' => 0,
                    'completed' => 0,
                ],

                'progress' => [
                    'percentage' => 0,
                    'completed_lessons' => 0,
                    'tracked_lessons' => 0,
                ],

                'points' => [
                    'total' => 0,
                ],

                'streak' => [
                    'current' => 0,
                    'longest' => 0,
                    'last_activity_on' => null,
                ],
            ],

            'twoFactor' => [
                'enabled' => $user->hasEmailTwoFactorEnabled(),
                'enabledAt' => $user->email_two_factor_enabled_at?->toISOString(),
            ],

            'passkeys' => $user->passkeys()
                ->latest()
                ->get([
                    'id',
                    'name',
                    'credential_id',
                    'credential',
                    'last_used_at',
                    'created_at',
                    'updated_at',
                ])
                ->map(fn ($passkey) => [
                    'id' => $passkey->id,
                    'name' => $passkey->name,
                    'authenticator' => null,
                    'last_used_at' => $passkey->last_used_at?->toISOString(),
                    'created_at' => $passkey->created_at?->toISOString(),
                ])
                ->values(),

            'sessions' => $this->userSessionService
                ->getSessions($user, $currentSessionId)
                ->values(),

            'sessionCount' => $this->userSessionService->count($user),
        ]);
    }
}