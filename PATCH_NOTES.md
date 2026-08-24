# Reports v5 — analytics, theme, export and performance upgrade

This patch updates only the Reports feature files.

## Changes

- Fixed the admin Reports PDF export Blade template by removing fragile Blade loop directives from the report body and using PHP block loops.
- Fixed the PDF response filename header.
- Added achievement leaderboard data using real `user_achievements` records and awarded points.
- Added top assignment performance using graded submission scores normalized against each assignment's `max_points`.
- Added top quiz performance using graded quiz-attempt percentages and pass counts.
- Added course thumbnail paths to the course breakdown and renders the thumbnail when available.
- Added a live system-coverage section for catalogue, access, engagement and finance indicators.
- Added working navigation to `/admin/courses` and the existing admin settings/audit activity area.
- Fixed the Platform Performance donut label so `OVERALL COMPLETION` cannot overlap the percentage.
- Added full light/dark theme variants while preserving the reference dark-mode visual hierarchy.
- Preserved real database-driven activity trend, traffic, enrollment and completion metrics.

## Validation

- PHP syntax check passed for `AdminReportsController.php`.
- PHP syntax check passed for `resources/views/admin/reports/pdf.blade.php`.
- TypeScript/JSX transpilation check passed for `Reports.tsx`.
