# Plan: Prevent overpayment in student fees + unlock report download at zero balance

## Goals

1. **No overpayment in student fee proof submission**
  In `app/lib/screens/student/student_fees_screen.dart`, students can submit only amounts that are:
  - greater than `0`
  - less than or equal to current `balance`
2. **Report download works for fully paid students**
  In `app/lib/screens/student/student_reports_screen.dart`, downloading report cards should succeed for students whose remaining fee balance is exactly `0`.
3. **Backend source of truth alignment**
  Ensure server authorization for report download and fee proof processing uses the same payable account resolution and balance logic.

## Current observed behavior

- Student proof submit currently checks only `> 0`, so users can enter an amount above due/balance.
- Report download access currently depends on fee account status checks; this can fail if status is stale while balance is already `0`.

## Scope

- **App (Flutter):**
  - `app/lib/screens/student/student_fees_screen.dart`
  - `app/lib/screens/student/student_reports_screen.dart`
- **Backend (alignment and enforcement):**
  - `backend/controllers/studentApp.js`
  - `backend/controllers/parentApp.js` (keep parent parity for report download behavior)
  - `backend/controllers/fees.js` (approval/submission consistency)
  - `backend/utils/feeAccountHelpers.js` (preferred account selection already central)

## Proposed implementation

### 1) App: prevent overpayment at submit time (`student_fees_screen.dart`)

- Read `fee?.balance` from loaded payload before submission.
- In `_submitProof(...)`, after parsing amount:
  - if no active account or balance is `null`: keep existing error behavior.
  - if `balance <= 0`: block submission with message like  
  **"Your balance is already cleared. No additional payment is required."**
  - if `parsedAmount > balance`: block with message like  
  **"Amount cannot be greater than your remaining balance (RWF ...)."**
- Keep current checks for proof image and positive amount.
- Optional UX improvement (same task if quick):
  - show helper text under amount input:  
  **"Remaining balance: RWF X"**
  - set input hint/max guidance using balance (soft guard only; hard guard remains in submit validation).

### 2) Backend: enforce the same rule server-side

- In student/parent fee proof submission path (controllers handling `submitFeeProof`/`submitPaymentProof`):
  - resolve preferred fee account with `findPreferredFeeAccount(...)`.
  - reject when:
    - no account found
    - account balance is `<= 0`
    - submitted amount `> account.balance`
  - return `400` with clear message to avoid accepting overpayment via API bypass.
- Keep status transitions (`UNDER_REVIEW`) unchanged after valid submissions.

### 3) Report download gate: use balance-based completion

- In `studentApp.downloadReport` and `parentApp.downloadReport`:
  - resolve account with `findPreferredFeeAccount(...)`.
  - authorize download when `account.balance === 0` (or `<= 0` defensively).
  - do not rely only on status text (`PAID`) for authorization.
- This ensures students with fully cleared balance can download report even if status was not recalculated yet.

### 4) Keep response shape stable for app

- No app contract change required; app continues using existing fees payload.
- Error messages should be explicit and user-friendly for SnackBars.

## Acceptance criteria

1. On student fees submit tab, entering an amount greater than current balance is blocked before API call.
2. API also rejects overpayment attempts with `400` if client-side checks are bypassed.
3. Students with `balance = 0` can download reports successfully.
4. Students with `balance > 0` cannot download reports (existing restriction preserved).
5. Parent report download path follows the same balance rule.

## Test checklist

- **Fees submit (app):**
  - balance `4000`, input `5000` -> blocked with clear message.
  - balance `4000`, input `4000` -> allowed.
  - balance `4000`, input `3500` -> allowed.
  - balance `0`, any positive input -> blocked.
- **Fees submit (API):**
  - direct POST with amount above balance -> `400`.
- **Report download:**
  - account status not `PAID` but balance `0` -> download authorized.
  - account status `PAID` but balance `> 0` (data anomaly) -> denied.
- **Regression:**
  - pending proof submission flow and approval flow still update account and status correctly.

## Rollout order

1. Backend guards for overpayment + balance-based report authorization.
2. App submit validation + user-facing messages.
3. QA with one student who has partial balance and one who is fully paid.

## Out of scope

- Redesigning fee status enums.
- Changing report rendering format/content.
- School admin bulk fee assignment behavior (handled in separate plan/work).

