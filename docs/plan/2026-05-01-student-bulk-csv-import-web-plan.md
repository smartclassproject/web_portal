# Web Plan: Student Bulk Import via CSV Template + Upload

## Goal

Add a user-friendly bulk student import flow in the Students page:

1. Download template CSV.
2. Fill student rows offline.
3. Upload CSV.
4. Review import results (created/failed rows).

## Scope

### In scope

- Add import controls to `StudentsPage`.
- Template download action.
- CSV file picker/upload action.
- Import summary and row-level error display.
- Refresh students list after successful imports.

### Out of scope (phase 1)

- Spreadsheet preview/editor in browser.
- XLS/XLSX support.
- Multi-step wizard with advanced mapping UI.

## UX Flow

## 1) New actions in Students page header

Add two buttons near existing actions:

- `Download Template`
- `Import CSV`

## 2) Download template

On click:

- Call `GET /api/students/import/template`
- Download as `students-import-template.csv`

## 3) Upload CSV modal

Modal sections:

- File input (`.csv`)
- Optional checkbox (future): `Validate only (dry run)`
- Submit button: `Upload and Import`

Post-upload show:

- Summary cards:
  - total rows
  - created
  - failed
- Table of failed rows:
  - row number
  - reason(s)

## 4) Success handling

- Show toast with created/failed counts.
- Close modal or keep open with results (preferred).
- Refresh students list if at least one row created.

## 5) Failure handling

- If file rejected (format/size), show inline error.
- If API returns row errors, render detailed result list.
- Provide `Download errors` (phase 2) if backend supports.

## UI Placement

Target:

- `web/src/pages/school/StudentsPage.tsx`

Add:

- Import buttons in action bar.
- New modal component:
  - `web/src/components/forms/StudentCsvImportModal.tsx` (or inline first pass)

## Service Layer

Update student service:

- `downloadStudentImportTemplate()`
- `importStudentsCsv(file: File, options?: { dryRun?: boolean })`

Expected response:

- `summary`
- `results[]` with row status/errors

## Permission Behavior

- Buttons visible only when user can create students:
  - `school_admin`
  - `school_staff` with `students` module
- Hide/disable otherwise.

Note:

- Frontend visibility is convenience only; backend remains source of truth.

## CSV Guidance Content

In modal helper text include:

- Required columns.
- Accepted gender values.
- Accepted date formats.
- Max file size / row limits.

For your current data style, explicitly mention support for columns like:

- `Names`, `Gender`, `Class`, `Father`, `Mother`, `Phone`, `Birthday`

while encouraging canonical template headers going forward.

## Testing Plan (Web + Playwright)

1. Template button downloads CSV successfully.
2. Upload valid CSV creates records and updates table.
3. Upload mixed CSV shows partial success with row errors.
4. Upload invalid file type shows validation error.
5. Staff with students module sees and can use import actions.
6. Unauthorized user cannot see/use import actions.

## Delivery Phases

### Phase 1 (must-have)

- Buttons + modal + upload call + summary/error display.
- Students list refresh after import.

### Phase 2 (should-have)

- Persist import result panel for review.
- Download failed rows as CSV.

### Phase 3 (nice-to-have)

- Pre-upload client-side sanity checks.
- Drag-and-drop upload and progress indicators.

## Acceptance Criteria

1. User can download a student import template from Students page.
2. User can upload a filled CSV and bulk-create students.
3. UI clearly shows created vs failed rows with row-level reasons.
4. Import controls respect role/module access rules.
5. Imported students are visible immediately after successful import.
