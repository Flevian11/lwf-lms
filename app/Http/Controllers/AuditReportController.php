<?php

namespace App\Http\Controllers;

use App\Services\AuditReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditReportController extends Controller
{
    public function __construct(
        protected AuditReportService $auditReportService,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $days = max(
            1,
            min(
                $request->integer('days', 30),
                365,
            ),
        );

        return Inertia::render('Admin/AuditReports', [
            'report' => $this->auditReportService->getOverview($days),
        ]);
    }
}