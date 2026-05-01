# Web Plan: Cross-Module Dependent Lookups for Staff Forms

## Goal

Ensure `school_staff` users can complete permitted workflows (such as student registration) even when forms require reference data from another module.

Example:

- A matron with `students` access can register a student and still select major/class values needed by the form.

## Problem

Some forms in one module depend on data from another module:

- Student form needs majors/classes (owned under courses domain).

When staff lacks `courses` module, UI may fail to load required dropdown options, blocking student registration.

## Scope

### In scope

- Student registration/edit forms: load cross-module dependency lookups through a dedicated backend dependency API.
- Keep UI actions/menus for unrelated modules hidden as currently designed.
- Add clear UX messaging for partial dependency failures.

### Out of scope (phase 1)

- Exposing full courses pages/navigation to staff without `courses` module.
- Changing core module assignment model.

## UX/Behavior Plan

## 1) Dependency-aware data loading

For student create/edit page:

- Load form dependencies from one endpoint:
  - `GET /api/students/dependencies`
- Populate:
  - major select
  - class select

Do not rely on broad courses list APIs in this flow.

## 2) Keep navigation/module visibility unchanged

- Staff with only `students` should still not see courses module pages in sidebar.
- They only gain required lookup data inside the student workflow.

## 3) Better error states

If dependency lookup fails:

- Show targeted error near major/class fields:
  - “Unable to load class/major options. Retry.”
- Keep page usable for non-dependent parts.
- Provide retry action for dependencies load only.

## Frontend Implementation Tasks

## A) Service layer

- Add method in student service (or dedicated dependency service):
  - `getStudentDependencies()`
- Response contract:
  - `{ majors: Array<{_id,name,code}>, classes: Array<{_id,name,code}> }`

## B) Student form updates

- Replace separate majors/classes fetch calls with dependency endpoint call.
- Maintain field validation:
  - `majorId` required
  - `classId` required

## C) Permission-aware fallback

- If user has `students` module, show student create form as normal.
- If dependency payload is empty, show explicit “No majors/classes configured yet” helper text.

## D) Optional reuse pattern

- Introduce a `useDependentLookups(flowKey)` hook for future cross-module forms.

## Testing Plan (Web + Playwright)

1. Staff user with `students` (without `courses`):
   - can open student form
   - sees major/class options
   - can submit successfully
2. Same user:
   - still cannot access `/school/courses` routes
3. Dependency API failure:
   - field-level error shown
   - retry works
4. Empty dependency dataset:
   - user sees clear message (not silent blank dropdown)

## Delivery Phases

### Phase 1 (must-have)

- Integrate dependency endpoint into student forms.
- Add proper loading/error/retry UX.

### Phase 2 (should-have)

- Extract reusable dependency-lookup hook.
- Apply pattern to other cross-module dependent forms.

## Acceptance Criteria

1. Matron/staff can complete student registration even without `courses` module.
2. Required major/class fields are populated from approved dependency API.
3. Staff navigation/module boundaries remain intact.
4. UX clearly communicates dependency loading issues and recovery paths.
