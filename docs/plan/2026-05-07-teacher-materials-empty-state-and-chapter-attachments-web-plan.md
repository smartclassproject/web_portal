# Web Plan: Materials Empty State + Chapter Materials Parity with Study Materials

## Goals

1. **`TeacherMaterialsPage`** — When there are no study materials, show a clear **empty state** (illustration/icon, short copy, primary CTA) instead of an empty table with headers only.
2. **`AddLessonModal` (chapters)** — When attaching materials to a chapter, match the **study materials** UX: **file type** selector, **link vs file upload**, optional infer type from filename, and **`uploadFileAsset`** for files (same flow as `AddMaterialModal`).

## Current Behavior

### Materials page (`web/src/pages/teacher/TeacherMaterialsPage.tsx`)

- After load, always renders a full table; `materials.map(...)` yields zero rows with no messaging.
- Upload flow is delegated to `AddMaterialModal`, which already implements file type + upload + link normalization (`AddMaterialModal.tsx` + `uploadFileAsset('study_material', file)`).

### Chapters / lessons (`web/src/pages/teacher/TeacherLessonsPage.tsx` + `AddLessonModal.tsx`)

- Materials are a simple row: name + URL + small type dropdown (`pdf` | `video` | `link` | `document` only). No file picker, no upload, no parity with `Material['fileType']`.
- Types: `LessonMaterial` in `web/src/types/index.ts` is `{ name, url, type }` with a narrow `type` union.

## Proposed Web Changes

### 1) Empty state on `TeacherMaterialsPage`

- After `!loading`, if `materials.length === 0`:
  - Render a centered card (reuse visual language from `TeacherLessonsPage` empty state: icon, title, subtitle, **Upload Material** button that opens the modal).
- If `materials.length > 0`, keep the existing table layout unchanged.

**Out of scope:** changing loading skeleton or global toast behavior.

### 2) Chapter materials UX in `AddLessonModal`

**Reference implementation:** `AddMaterialModal.tsx`

- Reuse or extract small helpers (avoid heavy abstraction unless duplication grows):
  - `inferFileTypeFromFileName` (same rules as materials modal).
  - `normalizeHttpUrl` for link mode.
- For each “attachment” added to the chapter:
  - **File type** `<select>` aligned with materials: `pdf`, `ppt`, `pptx`, `video`, `image`, `document`, `other`, `link`.
  - **Link mode:** URL field + validation (http/https).
  - **File mode:** file input + optional “chosen file” label; on submit (or on “Add to list”), call `uploadFileAsset('study_material', file)` and store returned `url`, `originalName`, `sizeBytes` (same response shape as materials upload).
- **List UI:** show each attached item with display name, type icon or label, link to open resource, remove button.
- **Payload mapping:** API today expects embedded lesson materials as `{ name, url, type }` (`Lesson.js`). Extend the client payload to include optional **`fileName`** / **`fileSize`** once backend accepts them (see backend plan). Until backend ships, either ship backend first or keep sending only `name` + `url` + `type` with `name` = file basename.

### 3) Types (`web/src/types/index.ts`)

- Expand `LessonMaterial` to match backend after migration:
  - `type` / or rename to align with `Material['fileType']` (single naming convention in UI).
  - Optional `fileName?: string`, `fileSize?: number` if stored.

### 4) Regression checks

- Create/edit chapter with **link-only** attachment (no upload).
- Create/edit chapter with **uploaded** PDF/video; confirm URL is `/uploads/study_material/...` or absolute API URL as returned by upload API.
- Edit existing lessons whose materials only have legacy `{ name, url, type }` — modal should preload and still allow add/remove.

## Dependencies

- **Backend** must accept `/uploads/...` URLs on lesson material entries (today `express-validator` uses `isURL()` on `materials.*.url`, which rejects typical upload paths). See `backend/docs/plan/2026-05-07-lesson-chapter-materials-parity-backend-plan.md`.

## Acceptance Criteria

1. Teacher opens Materials with zero rows → sees empty state + CTA, not a blank table.
2. Teacher adds a chapter attachment choosing **file** → file uploads via same mechanism as study materials; attachment appears in list with correct open link.
3. Teacher adds **link** attachment → validates and saves like materials link mode.
