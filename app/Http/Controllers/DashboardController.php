<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the authenticated user's dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        return Inertia::render('Dashboard', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'role' => $user->getRoleNames()->first(),
            ],
        ]);
    }
}