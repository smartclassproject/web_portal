# School Staff Management Plan (Web)

## Goal

Enable each school to manage non-teaching operational staff (for example: matron, patron, accountant, director of studies/DOS) using module-based access selection where modules are treated as permissions:

- **School Admin** can create and manage staff users within their own school.
- **Super Admin** can also create and manage staff users for any school.

This plan covers web portal UX, role governance, API contracts, and rollout expectations.

## Scope

### In scope

- New **School Staff** module in web admin area.
- Staff account lifecycle:
  - create
  - edit profile and role
  - activate/deactivate
  - reset credentials
- Role templates for operational staff categories.
- Shared creation authority for school admin and super admin.
- School-level access boundaries and audit trail visibility.

### Out of scope (phase 1)

- Payroll processing
- Advanced approval chains between staff roles
- Fine-grained action-level policy builder beyond module scope

## Staff Roles (Initial Catalog)

The system should ship with these staff role types (extendable):

- `MATRON`
- `PATRON`
- `ACCOUNTANT`
- `DIRECTOR_OF_STUDIES`
- `DISCIPLINE_MASTER` (optional if used by school)
- `LIBRARIAN` (optional)
- `OTHER` (custom title with controlled module access)

Role labels shown on UI can remain human-friendly (e.g., "DOS") while backend stores normalized enums.

## User + Data Model (Web-facing Contract)

### Entity: `SchoolStaff`

- `id`
- `schoolId`
- `firstName`
- `lastName`
- `email` (optional if phone-based auth is primary)
- `phoneNumber`
- `staffRole` (enum)
- `customRoleTitle` (required when role is `OTHER`)
- `modules[]` (selected module permissions for this staff user)
- `employmentStatus` (`ACTIVE` | `INACTIVE`)
- `createdByUserId`
- `createdByRole` (`SUPER_ADMIN` | `SCHOOL_ADMIN`)
- `updatedByUserId`
- `lastLoginAt` (optional)
- timestamps

### Entity: `SchoolStaffInvite` (optional if invitation flow is used)

- `schoolId`
- `staffId` (or pre-user placeholder)
- `deliveryChannel` (`SMS` | `EMAIL`)
- `inviteToken` / setup code
- `expiresAt`
- `consumedAt`

## Module Permissions and Access Rules

### Permission model (module-based)

Instead of typing raw permission strings, admins select modules from a fixed list. Each selected module acts as a permission grant.

Initial module catalog:

- `students`
- `teachers`
- `courses`
- `finance`
- `announcements`
- `inquiries`
- `reports`
- `library`

Role presets should preselect modules, and admins can adjust allowed modules where policy permits.

Example presets:

- `DIRECTOR_OF_STUDIES (DOS)` -> `students`, `teachers`, `courses`
- `ACCOUNTANT` -> `finance`, `reports`

### Super Admin

- Can create staff for any school.
- Can update/deactivate any staff user.
- Can assign role templates and override default module selection sets (if policy allows).
- Can create, edit, activate/deactivate modules in the module catalog.

### School Admin

- Can create staff only within own `schoolId`.
- Can update/deactivate staff only within own `schoolId`.
- Cannot create/modify super admin users.
- Cannot cross school boundaries.

### School Staff

- Authenticated access only to selected modules (`modules[]`).
- No ability to manage admin users (unless explicitly granted in later phases).

## Web UX Plan

### 1) Staff list page

- Path suggestion: `School Settings > Staff Management`.
- Features:
  - searchable list (name/phone/role/status)
  - filters by role and active status
  - badge for `Created by Super Admin` vs `Created by School Admin`
  - quick actions: edit, deactivate, reset password

### 2) Create staff form

Required fields:
- first name
- last name
- phone number
- role

Optional:
- email
- custom role title (only when `OTHER`)
- module selection (prefilled by role preset and editable by authorized admins)

Validation:
- unique phone within school scope (or global, based on auth model)
- required role and school binding
- prevent blank custom role title for `OTHER`
- `modules[]` must contain only allowed module keys

### 3) Edit staff form

- Update identity fields
- Update role
- Update module selection
- Toggle active/inactive
- Trigger credential reset flow

### 4) Access preview panel

- Show selected module permissions for the role/staff user.
- Helps school admin understand role impact before save.

### 5) Module catalog management (Super Admin)

- Path suggestion: `Super Admin > Access Control > Modules`.
- Features:
  - create module (`key`, `label`, `description`)
  - edit module metadata
  - activate/deactivate modules
  - mark module as `system` (optional, non-deletable)
- Rules:
  - only active modules can be selected in staff forms
  - deactivated modules remain on old users for audit/history, but cannot be newly assigned

## API Requirements (Web integration)

- `POST /api/staff` (super admin or school admin)
- `GET /api/staff?schoolId=...` (scoped by caller role)
- `GET /api/staff/:id`
- `PUT /api/staff/:id`
- `PUT /api/staff/:id/status` (activate/deactivate)
- `POST /api/staff/:id/reset-credentials`
- `GET /api/staff/roles/templates` (returns role -> default `modules[]`)
- `GET /api/staff/modules` (available modules catalog)
- `POST /api/staff/modules` (super admin only)
- `PUT /api/staff/modules/:id` (super admin only)
- `PUT /api/staff/modules/:id/status` (super admin only; activate/deactivate)

## Implementation Plan: Role-Based Module Visibility

### Objective

If a staff member (example: matron) has only `students` module permission, the UI must show only `students` and hide all other modules.

### Frontend behavior

1. On login (or session refresh), fetch authenticated user profile with `modules[]`.
2. Build sidebar/top navigation from a central module registry and filter by `modules[]`.
3. Hide unauthorized routes/pages from menu and quick links.
4. Add route guard for every module route:
   - if module key not in `modules[]`, redirect to `Not Authorized` or dashboard.
5. Keep a safe default:
   - empty `modules[]` -> show no protected modules.

### Suggested web implementation tasks

- Create `moduleRegistry` map:
  - module key -> route, label, icon, nav group.
- Add `hasModuleAccess(moduleKey)` helper.
- Wrap protected screens with `RequireModule(moduleKey)` component.
- Update layout shell to render navigation from filtered registry.
- Add `Not Authorized` screen for blocked access attempts.

### UX acceptance examples

- Matron with `modules[] = ["students"]` sees only Students menu and students pages.
- DOS with `modules[] = ["students","teachers","courses"]` sees those three only.
- Accountant with `modules[] = ["finance","reports"]` cannot open students/teachers pages by URL.

## Audit + Security Requirements

- Log all create/update/status changes with actor identity.
- Enforce school-level data scoping at middleware level.
- Rate-limit credential reset operations.
- Mask sensitive data in list payloads where not needed.

## Delivery Phases

### Phase 1 (Must-have)

- Staff role enums and CRUD APIs
- Web list + create + edit + deactivate flows
- Role preset + module-based visibility for staff users
- Navigation filtering + route guards by `modules[]`

### Phase 2 (Should-have)

- Invite/onboarding flow via SMS/email
- Credential reset history and login metadata
- Enhanced filters and export for staff directory
- Super-admin module catalog management UI

### Phase 3 (Nice-to-have)

- Fully custom per-staff action-level permissions editor
- Multi-campus assignment support
- Staff activity analytics dashboard

## Acceptance Criteria

1. School admin can create/manage staff for own school only.
2. Super admin can create/manage staff for any school.
3. Staff user record captures role, status, and creator metadata.
4. Unauthorized cross-school operations are blocked server-side.
5. Deactivated staff cannot log in.
6. Staff modules are selected from module list (not typed manually) and correctly gate portal visibility.
7. Super admin can add/manage module catalog items, and new modules are available for staff assignment.
8. A staff user with one module permission cannot see or open other modules in UI.

## Playwright Test Cases (Web)

Automated tests are implemented in:

- `web/e2e/staff-modules.spec.ts`

### Covered cases

1. **Students-only staff menu filtering**
   - Given `modules[] = ["students"]`
   - When user opens `/school/students`
   - Then sidebar shows `Students` only and hides other module entries (e.g., Teachers/Courses/Fees).

2. **Students-only staff route blocking**
   - Given `modules[] = ["students"]`
   - When user tries direct URL `/school/teachers`
   - Then app redirects to `/not-authorized`.

3. **DOS module visibility**
   - Given `modules[] = ["students", "teachers", "courses"]`
   - When user opens school portal
   - Then sidebar shows Students/Teachers/Courses and hides unrelated modules (e.g., Inquiries/Announcements).

### Run command

- From `web/`:
  - `pnpm playwright test e2e/staff-modules.spec.ts --project=chromium`
