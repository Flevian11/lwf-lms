<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use App\Services\CourseEnrollmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CourseEnrollmentController extends Controller
{
    public function __construct(
        protected CourseEnrollmentService $courseEnrollmentService,
    ) {
    }

    /**
     * Enroll the authenticated student in a published course.
     *
     * Enrollment is the primary operation. Audit, learning activity,
     * achievements and email are handled as isolated post-enrollment
     * concerns so a failure in any of them cannot undo a successful
     * enrollment.
     */
    public function store(
        Request $request,
        string $slug,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $course = Course::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $result = $this->courseEnrollmentService->enroll(
            $user,
            $course,
            $request,
        );

        return back()->with(
            'success',
            $result['created']
                ? ($result['has_access']
                    ? 'You are now enrolled and can start learning.'
                    : 'You are enrolled. Course access is pending.')
                : ($result['has_access']
                    ? 'You are already enrolled and can continue learning.'
                    : 'You are already enrolled. Course access is pending.'),
        );
    }
}
