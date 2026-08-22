<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditReportService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __construct(
        protected AuditReportService $auditReportService,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $days = max(1, min($request->integer('days', 30), 365));
        $auditPage = max(1, $request->integer('audit_page', 1));

        return Inertia::render('Admin/Settings', [
            'admin' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'email_two_factor_enabled' => (bool) $user->email_two_factor_enabled,
            ],
            'site' => [
                'name' => 'Learn With Flevian LMS',
                'url' => 'https://lwf.yaliid.cloud/',
                'description' => 'Learn With Flevian is an online learning platform for practical courses, programming, web development, technology skills, structured learning and meaningful achievements.',
                'logo' => '/favicon-192x192.png',
                'canonical' => 'https://lwf.yaliid.cloud/',
            ],
            'report' => $this->auditReportService->getOverview($days, $auditPage, 10),
        ]);
    }

    public function clearAuditLogs(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->hasRole('Admin'), 403);

        DB::transaction(function (): void {
            AuditLog::query()->delete();
        });

        return redirect()
            ->route('admin.settings', ['days' => 30, 'audit_page' => 1])
            ->with('status', 'Audit logs cleared successfully.');
    }
}
