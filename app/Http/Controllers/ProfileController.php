<?php

namespace App\Http\Controllers;

use App\Models\LearningInterest;
use App\Models\User;
use App\Services\StudentDashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected StudentDashboardService $studentDashboardService,
    ) {
    }

    /**
     * Display the authenticated student's profile.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $dashboard = $this->studentDashboardService
            ->getDashboardData($user);

        return Inertia::render('Profile', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],

            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'timezone' => $user->timezone,
                'locale' => $user->locale,
                'role' => $user->getRoleNames()->first(),
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'onboarding_completed_at' => $user->onboarding_completed_at?->toISOString(),
            ],

            'linkedAccounts' => [
                'google' => $user->socialAccounts()
                    ->where('provider', 'google')
                    ->exists(),
                'github' => $user->socialAccounts()
                    ->where('provider', 'github')
                    ->exists(),
            ],

            'learningInterests' => LearningInterest::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (LearningInterest $interest) => [
                    'id' => $interest->id,
                    'name' => $interest->name,
                ])
                ->values(),

            'selectedLearningInterestIds' => $user->learningInterests()
                ->pluck('learning_interests.id')
                ->map(fn ($id) => (int) $id)
                ->values(),
        ]);
    }

    /**
     * Update the authenticated student's profile.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:2',
                'max:120',
            ],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'timezone' => [
                'required',
                'string',
                'timezone:all',
            ],

            'locale' => [
                'required',
                'string',
                Rule::in([
                    'en',
                    'sw',
                ]),
            ],

            'avatar' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'learning_interest_ids' => [
                'nullable',
                'array',
            ],

            'learning_interest_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('learning_interests', 'id'),
            ],
        ]);

        $emailChanged = $validated['email'] !== $user->email;
        $oldAvatarPath = $user->avatar_path;

        DB::transaction(function () use (
            $request,
            $user,
            $validated,
            $emailChanged,
        ): void {
            $user->name = $validated['name'];
            $user->timezone = $validated['timezone'];
            $user->locale = $validated['locale'];

            if ($emailChanged) {
                $user->email = $validated['email'];
                $user->email_verified_at = null;
            }

            if ($request->hasFile('avatar')) {
                $user->avatar_path = $request
                    ->file('avatar')
                    ->store("avatars/{$user->id}", 'public');
            }

            $user->save();

            $user->learningInterests()->sync(
                $validated['learning_interest_ids'] ?? [],
            );
        });

        if (
            $request->hasFile('avatar') &&
            $oldAvatarPath &&
            ! str_starts_with($oldAvatarPath, 'http://') &&
            ! str_starts_with($oldAvatarPath, 'https://')
        ) {
            Storage::disk('public')->delete($oldAvatarPath);
        }

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();

            return back()->with(
                'success',
                'Profile updated. A new verification email has been sent to your new email address.',
            );
        }

        return back()->with(
            'success',
            'Your profile has been updated successfully.',
        );
    }
}
