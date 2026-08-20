<?php

namespace App\Http\Controllers;

use App\Services\StudentDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the authenticated user's dashboard.
     *
     * Dashboard aggregation is delegated to the appropriate
     * dashboard service. The controller is responsible only
     * for authentication, role selection, and Inertia delivery.
     */
    public function __invoke(
        Request $request,
        StudentDashboardService $studentDashboardService,
    ): Response {
        $user = $request->user();

        abort_unless($user !== null, 403);

        /*
         * For now we are building the student dashboard first.
         *
         * Admin dashboard routing/service will be introduced
         * separately once the student experience is complete.
         */
        if ($user->hasRole('Admin')) {
            abort(
                403,
                'The administrator dashboard is not available yet.'
            );
        }

        $dashboard = $studentDashboardService
            ->getDashboardData($user);

        return Inertia::render('Dashboard', $dashboard);
    }
}