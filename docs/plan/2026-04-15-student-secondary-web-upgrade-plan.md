# Student Secondary Screens Upgrade Plan (Web)

## Goal

Bring the web student experience to parity with the planned mobile and backend upgrades for:
- Fees
- Study Materials
- Student Profile Details
- Help (Inquiry to school admin)
- Privacy Policy
- Change Password

This plan aligns with:
- `app/docs/plan/2026-04-15-student-secondary-screens-upgrade-plan.md`
- `backend/docs/plan/2026-04-15-student-secondary-features-backend-plan.md`

## Scope Overview

### 1) Fees (Web)

#### UX requirements
- Clearly show **where student/parent must pay school fees**.
- Keep fee status and payment instruction details visible before proof submission.

#### Page sections
- **Fee status summary**
  - Total due, paid, balance, account status badge
- **Payment instructions panel**
  - payment channels (MoMo/Bank/Cash)
  - account/wallet number
  - account holder and branch/bank details
  - notes/deadlines
- **Submit payment proof form**
  - amount paid
  - method
  - transaction/reference number
  - optional note
  - upload placeholder support (if file API not yet available)

#### UX states
- No account yet
- No payment instructions configured
- Submission success/pending review

### 2) Study Materials (Web)

#### UX requirements
- Improve readability and findability of materials/lessons.

#### Proposed design
- Tab switch: `Materials` / `Lessons`
- Search + simple filters (subject/type/date)
- Modern card/table hybrid:
  - title
  - description preview
  - subject/course
  - file type/size
  - published date
  - open/download action

#### Accessibility/readability
- stronger typography hierarchy
- line clamping for long text
- clear action buttons for primary consumption

### 3) Student Profile Details (Web)

#### UX requirements
- Replace unstructured raw profile dump with sectioned design.

#### Sections
- Identity (name, student ID, class, status)
- Personal (DOB, gender, email, phone)
- Academic (major, enrollment year, term/cohort)
- Parent/guardian (names, phone)

#### Formatting rules
- human-friendly labels
- robust fallbacks (`Not provided`)
- consistent date formatting

### 4) Help / Inquiries (Web)

#### UX requirements
- Student should write to school admin through inquiry flow.

#### Page layout
- Left/main: inquiry list (subject, status, last update)
- Right/detail: selected inquiry thread (messages timeline)
- Top action: create new inquiry (subject + message)
- Reply box for active inquiry threads

#### Status design
- status chips: `open`, `answered`, `closed`
- sorted by latest activity

### 5) Privacy Policy (Web)

#### Behavior
- Render super-admin-managed policy content if available.
- If not available, show fallback lightweight policy text.

#### Page structure
- policy title
- last updated/version metadata
- rich text body (or plain formatted content)

### 6) Change Password (Web)

#### Required form fields
- current password
- new password
- confirm password

#### UX and validation
- inline validation + strength hint
- confirm-password match validation
- success/error toast feedback

## Technical Plan (Web)

### Phase 1 - Shared student settings layout
- Create reusable settings page shell + section card + status chip components.

### Phase 2 - Fees page refactor
- Integrate payment instructions block from backend.
- Keep proof submission action and error handling robust.

### Phase 3 - Materials/Lessons redesign
- Build tabbed content + search/filter + improved cards.

### Phase 4 - Profile details redesign
- Implement sectioned, readable profile detail view.

### Phase 5 - Help/inquiry UX enhancement
- Build inquiry list + thread + compose/reply flow.

### Phase 6 - Privacy + password
- Add privacy policy page with fallback.
- Implement full change-password form and validation.

### Phase 7 - QA and regression checks
- Verify responsive behavior (desktop/tablet/mobile web).
- Validate loading/empty/error states across all pages.
- Confirm API compatibility with backend rollout.

## Backend Dependency Matrix

- Fees page depends on:
  - student fee account data
  - school payment instruction payload
- Materials page depends on:
  - normalized materials/lessons metadata
- Profile page depends on:
  - structured student profile fields
- Help page depends on:
  - inquiry status + thread endpoints
- Privacy page depends on:
  - student privacy policy endpoint
- Change password depends on:
  - student password-change endpoint

## Acceptance Criteria

- Fees page clearly communicates where/how to pay and supports proof submission.
- Study materials are easier to scan, search, and open.
- Student profile details are cleanly sectioned and complete (DOB, major, parent/guardian, etc.).
- Help page supports inquiry creation, thread view, and reply workflow.
- Privacy policy page renders admin-managed content with fallback text if not configured.
- Change password page includes current/new/confirm fields with proper validation and feedback.
