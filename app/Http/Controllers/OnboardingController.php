<?php

namespace App\Http\Controllers;

use App\Models\LearningInterest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Show the student onboarding page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        /*
         * Admins never participate in student onboarding.
         *
         * This is a second layer of protection in addition to
         * AuthenticatedUserRedirect.
         */
        if ($user->hasRole('Admin')) {
            return redirect()->route('dashboard');
        }

        /*
         * A completed student should never see onboarding again.
         */
        if ($user->hasCompletedOnboarding()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
            ],

            'interests' => LearningInterest::query()
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                ]),
        ]);
    }

    /**
     * Complete student onboarding.
     */
    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        /*
         * Only Students can complete this onboarding flow.
         *
         * Admins are not supposed to have onboarding data at all.
         */
        if ($user->hasRole('Admin')) {
            return redirect()->route('dashboard');
        }

        /*
         * If onboarding has already been completed, don't process
         * the request again.
         */
        if ($user->hasCompletedOnboarding()) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validate([
            'interests' => [
                'required',
                'array',
                'min:1',
                'max:8',
            ],

            'interests.*' => [
                'integer',
                Rule::exists('learning_interests', 'id'),
            ],
        ]);

        DB::transaction(function () use ($user, $validated): void {
            $user->learningInterests()->sync(
                $validated['interests']
            );

            $user->forceFill([
                'onboarding_completed_at' => now(),
            ])->save();
        });

        return redirect()->route('dashboard');
    }
}