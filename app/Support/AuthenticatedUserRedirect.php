<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;
use Illuminate\Http\RedirectResponse;

class AuthenticatedUserRedirect
{
    /**
     * Return the URL for the authenticated user's workspace.
     */
    public static function targetUrl(User $user): string
    {
        if ($user->hasRole('Admin')) {
            return route('admin.dashboard');
        }

        if (! $user->hasCompletedOnboarding()) {
            return route('onboarding');
        }

        return route('dashboard');
    }

    /**
     * Redirect the authenticated user to the correct workspace.
     */
    public static function to(User $user): RedirectResponse
    {
        return redirect()->to(self::targetUrl($user));
    }
}
