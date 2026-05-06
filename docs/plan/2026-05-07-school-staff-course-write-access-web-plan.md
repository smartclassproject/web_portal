# Web Plan: Courses UX After Staff Write Access on `/api/courses`

## Goal

Ensure the school Courses UI matches backend permissions once `school_staff` can create, update, and delete courses when they hold the `courses` module—without misleading errors or hidden capability gaps.

## Context

- Today the UI (`web/src/pages/school/CoursesPage.tsx`) exposes **Add Course**, edit, and delete flows to all users who can reach the page; there is no client-side `school_admin`-only gate.
- Failures come from the API: `POST /api/courses` uses `authorizeRoles('school_admin')` only (see backend plan `2026-05-07-school-staff-course-write-access-backend-plan.md`).
- After the backend fix, the same flows should succeed for staff with the `courses` module using the existing `courseService` (`createCourse`, `updateCourse`, `deleteCourse`).

## Scope

### In scope

1. **Verification pass** after backend deploy:
   - Log in as `school_staff` with `courses` in JWT modules.
   - Create a course via **Add Course**; confirm list refresh and success toast.
   - Edit and delete a course; confirm no 403.

2. **Error messaging (recommended)**  
   File: `web/src/pages/school/CoursesPage.tsx` (and optionally shared axios interceptor pattern if one exists).

   - On 403 responses, surface the API `message` when present (e.g. `Access denied - missing module permission: courses`) instead of only a generic “Failed to create course.”
   - Helps distinguish permission issues from validation/network failures.

3. **Routing / menu alignment**  
   Confirm the Courses route is shown only when the app’s navigation logic already gates by module or role. If staff can open the page but mutations were forbidden, no nav change is strictly required; if any menu item assumes `school_admin` only for Courses, relax it to match `courses` module (align with backend).

### Out of scope (unless product asks)

- Redesign of Courses page or PDF export behavior.
- Client-side duplication of full RBAC (trust server + module flags for UX hints only).

## Proposed Web Changes

### 1) Optional: richer toast from Axios error

Pattern:

- Parse `error.response?.data?.message` for 403/401/409.
- Fall back to current generic copy.

Apply to:

- `createCourse` handler in `CoursesPage`
- `handleUpdateCourse`
- `confirmDelete`

### 2) Optional: hide mutation controls without module

If the frontend stores `user.modules` or equivalent from auth context:

- Hide or disable **Add Course**, row edit, and delete when `courses` is not in the module list (for `school_staff`); keep full controls for `school_admin`.

This avoids confusing UX for staff who lost module access while JWT is stale (they should refresh/login again—but hiding prevents accidental clicks).

## Acceptance Criteria

1. With backend fix deployed, `school_staff` + `courses` module completes full CRUD from the Courses page without 403.
2. Users see a clear message when the server rejects an action for permission reasons (if optional error-handling work is done).
3. No regression for `school_admin` workflows.

## Files Likely Involved

- `web/src/pages/school/CoursesPage.tsx` — toast/error handling; optional conditional buttons.
- `web/src/services/courseService.ts` — usually unchanged (errors bubble from axios).
- Navigation/sidebar component(s) — only if Courses visibility is incorrectly admin-only.
