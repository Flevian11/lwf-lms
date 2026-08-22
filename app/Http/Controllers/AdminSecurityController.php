<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\UserSessionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminSecurityController extends Controller
{
    public function __construct(
        protected UserSessionService $userSessionService,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $currentSessionId = $request->session()->getId();

        return Inertia::render('Admin/Security', [
            'admin' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'email_two_factor_enabled' => (bool) $user->email_two_factor_enabled,
            ],
            'security' => [
                'role' => $user->getRoleNames()->first() ?? 'Admin',
                'email_verified' => $user->email_verified_at !== null,
                'two_factor' => [
                    'enabled' => $user->hasEmailTwoFactorEnabled(),
                    'enabled_at' => $user->email_two_factor_enabled_at?->toISOString(),
                ],
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
    public function enableTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'two_factor' => ['Verify your administrator email address before enabling two-factor authentication.'],
            ]);
        }

        $user->forceFill([
            'email_two_factor_enabled' => true,
            'email_two_factor_enabled_at' => now(),
        ])->save();

        return response()->json([
            'enabled' => true,
            'status' => 'Email two-factor authentication has been enabled.',
        ]);
    }

    public function disableTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $user->forceFill([
            'email_two_factor_enabled' => false,
            'email_two_factor_enabled_at' => null,
        ])->save();

        return response()->json([
            'enabled' => false,
            'status' => 'Email two-factor authentication has been disabled.',
        ]);
    }

}
