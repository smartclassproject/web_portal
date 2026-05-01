# Staff Action Policy Plan (Web): Guarded Deactivate, Conditional Delete

## Goal

Update school staff management UX so action availability depends on password-setup progress:

1. Staff who **completed** password setup can be deactivated/activated.
2. Staff who **have not completed** password setup should use delete/removal flow instead of deactivation.

This replaces the current unconditional deactivate action in `web/src/pages/school/SchoolStaffPage.tsx`.

## Product Rule

Action matrix for each row:

- `passwordSetup = true`
  - Show `Deactivate` (if active) or `Activate` (if inactive).
  - Hide `Delete`.
- `passwordSetup = false`
  - Hide `Deactivate/Activate`.
  - Show `Delete` (or `Remove`) with confirmation.

Supporting actions remain:

- `Edit`
- `Resend Credentials` (for pending setup)
- `Reset Credentials`

## Current Gap

- Current UI always shows `Deactivate/Activate` regardless of setup completion.
- Current UI does not expose a dedicated delete flow for pending-setup staff.

## UX Changes

## 1) Conditional row actions

In `SchoolStaffPage` action buttons:

- Keep `Edit` always visible.
- Keep `Reset Credentials` always visible.
- Keep `Resend Credentials` only for pending setup.
- Add `Delete` button only when `passwordSetup === false`.
- Render `Deactivate/Activate` only when `passwordSetup === true`.

## 2) Delete confirmation UX

For pending-setup delete:

- Use a confirmation modal/dialog:
  - Title: `Delete Staff`
  - Warning copy: "This action permanently removes the staff account."
  - Confirm button: `Delete Staff`
- Disable confirm while request is in progress.
- On success:
  - Toast: `Staff deleted successfully`
  - Reload list.

## 3) Optional safety signals

- Add a small helper text under action column tooltip/legend:
  - "Deactivate is available after password setup is completed."

## API Contract Dependencies (Web)

Frontend will consume:

- `passwordSetup` from `GET /api/staff`
- New delete endpoint response:
  - `DELETE /api/staff/:id` (or equivalent agreed backend path)

## Web Implementation Tasks

1. Update `staffService` with delete method:
   - `deleteStaff(id: string)`
2. Add delete confirmation state/modal in `SchoolStaffPage`.
3. Replace unconditional status toggle action with conditional rendering by `passwordSetup`.
4. Keep existing filters/badges aligned:
   - `Password Setup` badge remains source of truth for action gating.
5. Update user-facing copy and toasts.

## Error Handling

- If backend blocks deactivate because setup is pending:
  - Show backend message toast (defense-in-depth scenario).
- If delete fails due to policy constraints:
  - Surface API message and keep row unchanged.

## Testing Plan (Playwright)

Update `web/e2e/school-staff.spec.ts` with policy scenarios:

1. `pending setup shows Delete, hides Deactivate`
2. `completed setup shows Deactivate, hides Delete`
3. `delete pending setup staff succeeds and row disappears`
4. `deactivate completed setup staff succeeds`
5. `attempted blocked action returns clear error`

## Delivery Phases

### Phase 1 (must-have)

- Conditional action rendering in UI.
- Pending-setup delete flow with confirmation.
- Updated e2e coverage for action matrix.

### Phase 2 (should-have)

- Unified action policy helper text and improved empty/error states.

## Acceptance Criteria

1. Pending-setup staff rows no longer expose deactivate/activate action.
2. Completed-setup staff rows no longer expose delete action.
3. Pending-setup delete works end-to-end with confirmation.
4. Completed-setup deactivate/activate continues to work unchanged.
5. UI and API error messages are explicit when policy is violated.
