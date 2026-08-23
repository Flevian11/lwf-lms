# Admin allocation + achievement audit fix

## Fixes

- Fixed achievement create/update/delete/award audit calls to pass the current Illuminate HTTP request into `AuditLogService::resourceEvent()`.
- Fixed assignment and quiz allocation student discovery so it is based on the actual course enrollment/access relationship rather than requiring the Student role scope alone.
- Admin accounts are excluded from allocation candidates.
- Candidates must be enrolled in the specific assignment/quiz course and have granted access.
- Existing course-specific allocation behaviour and email failure isolation are preserved.
