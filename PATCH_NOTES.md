# Admin assessment allocation eligibility — v3

- Assignment allocation candidates now include only learners with active/completed course access who have neither an existing allocation nor a submission for the selected assignment.
- Quiz allocation candidates now include only learners with active/completed course access who have neither an existing allocation nor a quiz attempt for the selected quiz.
- The same eligibility filter is enforced by the POST allocation endpoints, so stale UI selections cannot reallocate learners who have already been allocated or have already submitted/attempted.
- Existing allocations/attempts remain visible in the selected assessment detail; only the new-allocation candidate list is filtered.


## v4 — allocation eligibility relation fix
Replaced inverse User relationship checks with direct `whereNotExists` subqueries against assignment/quiz allocation and submission/attempt tables. This fixes the `Call to undefined method User::assignmentAllocations()` and `User::quizAllocations()` errors while preserving the eligibility rules.
