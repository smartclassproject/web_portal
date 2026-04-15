# Web Plan: School Fees Modals UX + Devices Fee Summary

## Goals

1. **School fees — pending queue + reject flow** — Clear loading while rejecting, avoid accidental closes, refresh list, and close the review queue modal when no pending items remain.
2. **Devices page — fee context** — Surface **bank name** and **account holder** from school payment instructions next to the existing “Edit on School fees” link.

## Fees page (`/school/fees`)

### Modal behavior

- **Review pending submissions** modal:
  - While **reject** is submitting: dim and disable interaction on the list (`pointer-events-none`, reduced opacity).
  - Do not close this modal via backdrop if the **reject** modal is open (avoids stacking confusion).
  - After **approve**: reload data; if **pending count is 0**, close the queue modal automatically.
  - After **reject**: close reject modal first; reload; if **pending count is 0**, close the queue modal (if items remain, keep queue open).

### Reject modal

- **Loading**: Disable inputs and actions; show **“Submitting rejection…”** and spinner on confirm; optional `aria-busy` for accessibility.
- On success: toast + refresh + close reject modal; queue modal closes only when queue is empty.

## Devices page (`/school/devices`)

- Fetch `GET /api/fees/instructions` (same as fees admin source).
- Banner shows when at least one of **bank name** or **account holder** is set:
  - **Bank name:** `bankName`
  - **Account holder:** `bankAccountName` or `momoAccountName`
- Separator dots between parts; link to **School fees** to edit full instructions.

## Acceptance Criteria

- Reject flow never feels “stuck” without feedback; list cannot be clicked through during submit.
- Last pending item cleared → queue modal closes without manual dismiss.
- Devices page shows bank name and holder when configured.

## Out of scope

- Changing fee approval API contracts.
- Parent app parity (separate task if needed).
