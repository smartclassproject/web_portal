# Web Plan: Reusable Upload Integration (Fees, Teachers, Attachments)

## Goal

Integrate the new backend reusable upload API into web flows so users can upload:
- Images (required for fee proof)
- Videos
- Documents (PDF/PPT/etc.) where permitted

## Priority Flows

1) Student fee proof submission (image only)
2) Teacher material uploads (image/video/document)
3) Shared upload component for future forms

## UX Principles

- Upload feels consistent across forms.
- Users get immediate validation feedback.
- Progress + success + failure states are explicit.
- Selected files can be previewed/replaced before final submit.

## Component Plan

### New shared component: `FileUploadField`
- Props:
  - `context` (`fees_proof`, `study_material`, ...)
  - `accept`
  - `maxSizeMb`
  - `multiple` (default false)
  - `onUploaded(asset)`
- States:
  - idle
  - validating
  - uploading
  - uploaded
  - error

### Shared helpers
- MIME/type validation helper
- file size formatter
- upload progress state helper

## API Integration Contract

- Upload call: `POST /api/uploads` (multipart)
- Expected response:
  - `assetId`
  - `url`
  - `mimeType`
  - `category`
  - `sizeBytes`
  - `context`

UI should store and submit `assetId` (not raw local file path).

## Feature-by-Feature Plan

### A) Student Fees page

#### Requirements
- Payment proof must be an image.

#### Implementation
- In proof form, replace free URL/manual attachment with `FileUploadField`:
  - `context = fees_proof`
  - `accept = image/*`
- On successful upload:
  - store `proofAssetId`
  - show image preview and filename/size
- Submit payload includes `proofAssetId`.
- Show clear errors if wrong file type/oversize.

### B) Teacher materials

#### Requirements
- Support image/video/document file uploads.

#### Implementation
- Use same reusable component with `context = study_material`.
- Save returned `assetId` and metadata into material create/update forms.
- Render proper badge/icon by file category in listing.

### C) Future modules
- Announcements/news attachment flow can reuse exact component with new context.

## UI/Design Details

- Drag-and-drop + click-to-select area.
- File chips/cards:
  - name
  - size
  - type badge
  - remove/replace action
- Progress bar while uploading.
- Disabled submit while upload in progress.

## Error Handling

- Show backend validation message directly when available.
- Recoverable errors keep form data intact.
- Retry button for failed uploads.

## Security & Validation on Client

- Pre-check extension/type/size before upload.
- Do not trust client-only checks; backend remains source of truth.
- Prevent submitting form without required `assetId` in strict contexts.

## Delivery Phases

### Phase 1 - Shared uploader component
- Build `FileUploadField` + helper utilities.

### Phase 2 - Fees integration
- Enforce image-only fee proof uploads.

### Phase 3 - Teacher materials integration
- Wire uploads for image/video/document.

### Phase 4 - UX polish + testing
- Progress states, accessibility checks, and regression tests.

## Acceptance Criteria

- Web has one reusable upload UI integrated with new upload API.
- Fee proof submission only accepts images and sends `proofAssetId`.
- Teacher content upload supports image/video/document by context policy.
- Upload progress, preview, and errors are clearly shown to users.
