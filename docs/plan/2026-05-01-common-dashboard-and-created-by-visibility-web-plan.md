# Web Plan: Common Dashboard + Created-By Visibility by Module

## Goal

Design a shared dashboard experience where:

1. Cards and graphs are shown based on user module access.
2. Super admin can view `createdBy` insights across registration flows.
3. School admin/staff get only relevant, module-scoped dashboard content.

This aligns with backend work for creator audit fields and module-filtered dashboard APIs.

## Scope

### In scope

- Common dashboard page architecture for school roles.
- Module-aware rendering of cards and graphs.
- Created-by visibility widgets for super admin.
- UI contracts for creator metadata in relevant list/detail pages.
- Add school staff account page using same pattern as `TeacherAccountPage` (profile + password + photo).

### Out of scope (phase 1)

- Full redesign of all existing dashboards.
- Deep report builder/custom graph designer.

## UX Strategy

## 1) Common dashboard shell

Create/reuse a dashboard shell that composes sections by module keys:

- `students`, `teachers`, `courses`, `announcements`, `inquiries`, `finance`, `reports`, etc.

Rendering rule:

- Build section registry (`moduleKey -> cards + graphs + links`).
- Show only sections returned/permitted by backend and user modules.

## 2) Cards (module-scoped)

Examples:

- Students module:
  - Total Students
  - New Admissions (period)
- Teachers module:
  - Total Teachers
  - Active Teachers
- Courses module:
  - Total Courses
  - Active Schedules
- Announcements module:
  - Total Announcements
  - Recent Published

No module access => no card, no placeholder noise.

## 3) Graph visibility rules

Each graph is tied to one module key:

- Enrollment trend -> `students`
- Teacher growth -> `teachers`
- Course activity -> `courses`
- Announcement activity -> `announcements`
- Finance trend -> `finance`

Only render graph when:

- backend includes dataset and
- module is permitted for current user.

## 4) Super admin created-by visibility

Add dedicated super admin dashboard widgets:

- Records by creator role (bar/pie)
- Top creators table
- Recent created records with source (`createdByRole`, `createdByModel`)

For school admin/staff:

- show lightweight creator attribution only in relevant tables/details (optional icon/tooltip/column).

## Data Contracts (Web)

Consume backend endpoints:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/graphs`
- `GET /api/admin/dashboard/creator-analytics` (super admin only)

Expected payload shape pattern:

- `sections[moduleKey]` for cards
- `graphs[moduleKey]` for datasets
- `creatorAnalytics` for super admin widgets

## Frontend Implementation Tasks

## A) Service layer

Add dashboard service methods:

- `getDashboardSummary()`
- `getDashboardGraphs()`
- `getCreatorAnalytics()` (super admin)

## B) Permission-aware rendering helpers

Add utility:

- `canViewModule(moduleKey, user)`

Use it across dashboard cards and graph components.

## C) Dashboard composition

- Introduce module registry map for sections.
- Render loop:
  1. available backend sections
  2. permission check
  3. component mount

## D) Created-by UI in entity pages

For teacher/student/announcement (and other registration pages):

- Show creator metadata in details drawer/modal or list column where helpful.
- For missing legacy values, display `-`.

## E) Empty/loading/error states

- Section-level loading skeletons.
- Module-level fallback when dataset missing.
- Graceful partial rendering if one module graph fails.

## F) Account page parity

- Add `SchoolStaffAccountPage` with:
  - profile view/edit
  - profile photo upload
  - password change section
- Add route and sidebar entry parity with teacher/admin account experience.

## Testing Plan (Web + Playwright)

1. School staff user with limited modules sees only permitted cards.
2. Graphs hidden when module not assigned.
3. Super admin sees creator analytics widgets.
4. Legacy records with null `createdBy` render without crash.
5. Partial API failure still renders remaining sections.

## Delivery Phases

### Phase 1 (must-have)

- Module-aware cards and graphs on common dashboard.
- Dashboard service integration with new backend endpoints.

### Phase 2 (should-have)

- Super admin creator analytics dashboard widgets.
- Created-by display in core list/detail pages.

### Phase 3 (nice-to-have)

- Drill-down interactions from cards/graphs to filtered tables.
- Saved dashboard views by role.

## Acceptance Criteria

1. Users only see cards/graphs for modules they can access.
2. Super admin dashboard includes creator-based analytics.
3. Created-by metadata is visible where relevant for registered entities.
4. Dashboard remains usable under partial data failures.
5. UI behavior stays consistent with backend permission enforcement.
