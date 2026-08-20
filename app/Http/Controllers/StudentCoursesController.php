<?php

namespace App\Http\Controllers;

use App\Services\StudentDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentCoursesController extends Controller
{
    public function __construct(
        protected StudentDashboardService $studentDashboardService,
    ) {
    }

    /**
     * Display the authenticated student's courses.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $data = $this->studentDashboardService
            ->getCoursesData($user);

        return Inertia::render('Courses', $data);
    }
}