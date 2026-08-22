<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminProfileController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        return Inertia::render('Admin/Profile', [
            'admin' => $this->adminPayload($user),
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'timezone' => $user->timezone,
                'locale' => $user->locale,
                'role' => $user->getRoleNames()->first(),
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'created_at' => $user->created_at?->toISOString(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'timezone' => ['required', 'string', 'timezone:all'],
            'locale' => ['required', 'string', Rule::in(['en', 'sw'])],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $oldAvatarPath = $user->avatar_path;
        $emailChanged = $validated['email'] !== $user->email;

        DB::transaction(function () use ($request, $user, $validated, $emailChanged): void {
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
        }

        return back()->with('success', 'Administrator profile updated successfully.');
    }

    public function sendVerification(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        if ($user->hasVerifiedEmail()) {
            return back()->with('success', 'Your email address is already verified.');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'A verification link has been sent to your email address.');
    }

    /** @return array<string, mixed> */
    private function adminPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_path' => $user->avatar_path,
            'email_two_factor_enabled' => (bool) $user->email_two_factor_enabled,
        ];
    }
}
