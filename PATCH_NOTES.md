# Admin Premium UI v7

UI-only refinement for the existing admin functionality.

## Design target

The admin pages now follow the visual language of the supplied learner Achievements/Security/Support references while remaining inside `AdminLayout` and using admin-specific components.

## Changes

- Admin cards now use the same restrained gradient/border/shadow treatment as the reference UI.
- Summary cards use the compact reference-style layout.
- Admin section headers use the compact reference hierarchy.
- Students now use a main directory + contextual sidebar composition instead of leaving a large empty lower canvas.
- Students sidebar includes account health, learning activity and administrator guidance.
- Assignments now use a main assessment register + contextual workflow sidebar.
- Quizzes now use a main assessment register + contextual workflow sidebar.
- Existing search, pagination, allocation, grading, editing, awarding and access functionality is preserved.
- No StudentLayout or StudentUI dependency was introduced into the admin pages.
