# Staff Password Flow Alignment Plan (Match Teacher Flow)

## Goal

Make school staff account onboarding follow the same credential lifecycle used for teachers:

1. On create, send an email containing login credentials (email + temporary/default password).
2. Allow admin to resend credentials email when needed.
3. Keep reset-password path available for recovery.

This aligns behavior between:

- `web/src/pages/school/TeachersPage.tsx`
- `web/src/pages/school/SchoolStaffPage.tsx`

## Current State

### Teacher flow (reference behavior)

- Teacher is created via `createTeacher(...)`.
- Backend sends initial credentials email.
- UI shows `Resend Credentials` action for teachers who have not completed password setup.
- Password setup/reset completes via existing auth setup/reset flow.

### Staff flow (current)

- Staff can be created/edited/activated/deactivated/reset from `SchoolStaffPage`.
- Staff reset is currently direct password reset from admin modal.
- Missing parity:
  - explicit resend credentials email action
  - first-time credentials email lifecycle equivalent to teachers
  - explicit visibility of whether staff has completed password setup

## Target UX (School Staff)

### Staff list actions

For each staff user row:

- `Edit`
- `Activate/Deactivate`
- `Resend Credentials` (conditional)
- `Reset Password` (admin-forced reset)

### Creation behavior

When admin clicks `Create Staff`:

- Submit create request with generated/entered temporary password.
- Backend sends credentials email automatically.
- UI shows success toast:
  - "Staff created. Credentials email sent."
- If email sending fails but staff is created, show warning toast:
  - "Staff created, but credentials email failed. Use Resend Credentials."

### Reset behavior

- Keep admin reset flow for urgent recovery.
- After reset, optional backend behavior:
  - send reset/setup email automatically OR
  - require admin to click `Resend Credentials`.

## API Contract Changes (Web dependencies)

## 1) Create staff response

`POST /api/staff` should return fields supporting onboarding status:

- `passwordSetup` (boolean)
- `credentialsEmailSent` (boolean, optional)
- `defaultPassword` (optional; only if product policy allows showing once)

## 2) Resend credentials endpoint (staff)

Add endpoint parallel to teachers:

- `POST /api/staff/:id/resend-credentials`

Expected responses:

- `200` success when email resent
- `400` when not allowed (e.g., already completed setup if policy forbids resend)
- `404` staff/user not found

## 3) Staff list payload

`GET /api/staff` should include:

- `passwordSetup` (boolean)
- optional `lastCredentialsSentAt`

This allows conditional rendering of `Resend Credentials`.

## Web Implementation Tasks

## A) Service layer

Update `web/src/services/staffService.ts`:

- extend `StaffUser` type with `passwordSetup?: boolean`
- add `resendStaffCredentials(id: string)` method

## B) Staff page actions

Update `web/src/pages/school/SchoolStaffPage.tsx`:

- Add row action `Resend Credentials`.
- Show action based on `passwordSetup` policy (same as teacher UX).
- Add loading state per-row for resend button.
- Improve success/error toasts for email lifecycle outcomes.

## C) Copy and consistency

- Match button naming/copy with `TeachersPage`:
  - `Resend Credentials`
  - success: "Login credentials email has been resent successfully!"

## D) Optional UI enhancements

- Add badge/column:
  - `Password Setup: Pending / Completed`
- Add filter by password setup status.

### Optional UI Enhancements Implementation Detail

#### 1) Password setup status badge

Add a dedicated table column in `SchoolStaffPage`:

- `Pending` badge (amber) when `passwordSetup = false`
- `Completed` badge (green) when `passwordSetup = true`

Behavior:

- Badge must update immediately after successful resend/reset actions when backend returns updated status.
- Tooltip (optional): show `lastCredentialsSentAt` when available.

#### 2) Password setup status filter

Add filter control near search input:

- `All`
- `Pending setup`
- `Completed setup`

Filtering rules:

- Preserve existing text search behavior.
- Apply status filter and search filter together.

#### 3) Last credentials sent metadata (optional column)

If backend provides `lastCredentialsSentAt`:

- Render a compact date/time in staff table.
- Show `-` when missing.
- Use local timezone formatting.

#### 4) UX acceptance checks

- Admin can quickly identify staff who still need to set password.
- Admin can isolate `Pending setup` list and resend credentials in bulk workflow (manual repeated clicks in phase 1).
- Table remains readable on small screens (status badge wraps without layout break).

## Edge Cases

- Email provider timeout:
  - staff created successfully but email failed.
  - UI instructs admin to retry resend.
- Duplicate resend clicks:
  - disable button while request in progress.
- Inactive staff:
  - policy decision whether resend allowed while inactive.

## Testing Plan (Playwright)

Add/extend tests in `web/e2e/school-staff.spec.ts`:

1. **Create staff triggers credentials workflow**
   - Assert successful create and email-sent feedback.

2. **Resend credentials action works**
   - Click `Resend Credentials` and assert success feedback.

3. **Resend credentials error handling**
   - Mock failure and assert clear error message.

4. **Reset password remains available**
   - Ensure reset modal still works and does not regress.

## Delivery Phases

### Phase 1 (must-have)

- Backend endpoint support for staff resend credentials.
- Web staff list includes `passwordSetup`.
- Web `Resend Credentials` button + loading/error states.

### Phase 2 (should-have)

- Better onboarding telemetry (`lastCredentialsSentAt`).
- Password setup status badge/filter in UI.

### Phase 3 (nice-to-have)

- Unified reusable credentials-resend component shared by Teachers + Staff.

## Acceptance Criteria

1. Creating staff triggers credentials-email flow equivalent to teacher onboarding.
2. School admin can resend credentials for staff from staff list.
3. Staff reset-password path remains functional.
4. Error states (SMTP timeout/failure) are surfaced clearly without blocking admin operations.
5. Staff credential flow UX is consistent with teacher flow language and actions.
