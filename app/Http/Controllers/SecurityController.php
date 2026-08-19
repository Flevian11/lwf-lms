<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    /**
     * Display the authenticated user's security settings.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        return Inertia::render('Security', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
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
                    'authenticator' => $passkey->authenticator,
                    'last_used_at' => $passkey->last_used_at?->toISOString(),
                    'created_at' => $passkey->created_at?->toISOString(),
                ])
                ->values(),
        ]);
    }
}