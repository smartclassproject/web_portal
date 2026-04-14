# Web Plan: Announcements Save Loader + Inquiries UX Upgrade

## Goal

Improve the web admin experience for:
- Saving announcements (clear loading + better visual flow)
- Managing student inquiries (threaded history + reply form UX)

## 1) Announcements: loader on save + design improvements

### Current issue
- Save action lacks clear in-progress feedback and design feels basic.

### Plan

#### Save flow UX
- Add `isSaving` state to announcement form/modal.
- On `Save` click:
  - Disable `Save` and `Cancel` buttons
  - Show inline spinner and `Saving...` label
  - Keep modal/page open until request resolves
- On success:
  - Show success toast
  - Close/reset form intentionally
- On failure:
  - Keep form open
  - Show backend error message toast
  - Preserve user-entered form values

#### Design upgrades
- Improve form hierarchy:
  - clearer title/subtitle
  - section spacing
  - stronger label/help text styling
- Improve action row:
  - primary/secondary button contrast
  - predictable disabled states
- Improve announcement list cards/table:
  - title prominence
  - excerpt/preview line clamp
  - publish date and author metadata chips
  - visual badge for status (`draft`, `published`, `scheduled`)

#### Accessibility
- Add aria labels for save/loading state.
- Ensure keyboard focus remains consistent during save.

---

## 2) Inquiries: better design + reply form + full chat history

### Objectives
- Make inquiry management readable and fast.
- Provide a proper threaded conversation history and reply composer.

### Page structure plan

#### Layout
- Two-panel responsive layout:
  - Left: inquiry list
  - Right: selected inquiry detail (history + reply)
- On smaller screens:
  - list view -> detail route pattern

#### Inquiry list panel
- Search input (subject/student name)
- Filters:
  - Status (`open`, `answered`, `closed`)
  - Date range (optional phase 2)
- List item contents:
  - Student name
  - Subject
  - Last message preview
  - Last updated time
  - Status chip
  - Unread indicator (if available)

#### Inquiry detail panel (chat history)
- Header:
  - Subject
  - Student identity info
  - Status + quick status change controls
- Timeline thread:
  - Message bubbles separated by sender (student/admin)
  - Timestamps
  - Optional system events (status changed, reassigned)
- Empty state when no inquiry selected.

#### Reply form
- Sticky bottom composer in detail panel:
  - Textarea
  - `Send reply` button
  - Optional quick templates (phase 2)
- Reply submission behavior:
  - Disable while sending
  - Spinner + `Sending...`
  - Optimistic append or re-fetch thread on success
  - Show inline error on failure

---

## Technical Execution Plan

### Phase 1 - Announcements interaction polish
- Add `isSaving` handling for announcement create/edit.
- Add disabled/loading states and robust success/error toasts.
- Refine form spacing, typography, and action row consistency.

### Phase 2 - Inquiries layout and list experience
- Implement split-view inquiries page with search/filter controls.
- Improve list item information density and status chips.

### Phase 3 - Thread history + reply workflow
- Add full conversation timeline panel.
- Add reply form with validation and async loading states.

### Phase 4 - State management and performance
- Normalize inquiry list/detail state.
- Add selective refresh for active thread after reply.
- Add pagination or lazy loading for long histories.

### Phase 5 - QA and UX hardening
- Validate keyboard navigation and focus behavior.
- Validate loading/empty/error states for list and detail.
- Cross-browser checks for layout consistency.

## Backend/API Requirements

- Inquiry list endpoint returns:
  - subject, status, student metadata, last message, updatedAt
- Inquiry detail endpoint returns:
  - full thread history, sender, timestamps
- Reply endpoint:
  - appends admin message and returns updated thread item
- Optional status update endpoint for inquiry lifecycle.

## Acceptance Criteria

- Announcement save action always shows loading feedback until completion.
- Failed save does not close form and displays backend error message.
- Inquiries page clearly shows list and chat history.
- Admin can reply from a dedicated form in inquiry detail view.
- Conversation history is readable and chronologically clear.
