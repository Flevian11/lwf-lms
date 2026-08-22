<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\RedirectResponse;

class AuthenticatedUserRedirect
{
    /**
     * Determine where an authenticated user should be sent.
     */
    public static function to(User $user): RedirectResponse
    {
        /*
         * Admins never go through student onboarding.
         */
        if ($user->hasRole('Admin')) {
            return redirect()->route('admin.dashboard');
        }

        /*
         * Students who have not completed onboarding
         * must finish it before accessing the dashboard.
         */
        if (! $user->hasCompletedOnboarding()) {
            return redirect()->route('onboarding');
        }

        /*
         * Completed students go directly to the dashboard.
         */
        return redirect()->route('dashboard');
    }
}