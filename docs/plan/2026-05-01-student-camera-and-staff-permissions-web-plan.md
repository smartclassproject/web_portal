# Web Plan: Student Direct Camera Capture + Staff Access Reliability

## Goal

Improve student onboarding UX and remove access/image blockers in production:

1. Capture student photo directly from device camera when clicking the default avatar area.
2. Ensure school staff can use majors/classes/attendance-dependent pages without authorization dead-ends.
3. Fix blocked profile/image rendering on HTTPS deployment.

## User-Reported Issues

1. Need direct camera capture for student image from Add/Edit Student flow.
2. `school_staff` login succeeds, but API calls fail with 403:
   - `/api/majors/school/majors`
   - `/api/classes`
   - `/api/attendance/school/attendance`
3. Profile image URL loaded over HTTP is blocked on HTTPS frontend:
   - `http://41.186.188.119:5000/uploads/...`

## Scope

### In scope

- `AddStudentModal` photo picker redesign to support camera-first capture.
- Frontend access handling for endpoints after backend permission fix.
- Same-origin HTTPS-safe image URL strategy for `/uploads`.

### Out of scope (phase 1)

- Full in-browser image editor (crop/rotate).
- Video recording.
- Native mobile app camera integration.

## UX Plan: Direct Camera Capture

Target file: `web/src/components/forms/AddStudentModal.tsx`

## 1) Click behavior on default image

- Replace passive placeholder click with action trigger:
  - tap/click default image area -> open source options.

## 2) Device-aware capture strategy

### Mobile-first

- Use file input with `accept="image/*"` and `capture="environment"` to open device camera directly.
- Keep fallback to gallery if user/device does not force camera.

### Desktop fallback

- Add camera modal using `navigator.mediaDevices.getUserMedia({ video: true })`.
- Show preview stream with Capture button.
- Capture frame to canvas, convert to blob/file, then reuse existing upload flow.

### Permissions and failures

- If camera permission denied/unavailable:
  - show clear toast and fallback to normal file picker.

## 3) Upload flow compatibility

- Reuse existing `uploadStudentPhoto(file)` service.
- No API contract changes on web side.
- Preserve current loading/error UX.

## Access Reliability Plan (Staff)

## 1) Client behavior after backend auth fix

Target pages/services:

- `StudentsPage` dependency calls
- majors/classes consumers
- attendance consumers

Actions:

- Keep using existing endpoints.
- Improve user-facing errors:
  - if 403 persists, show module-specific helper text ("ask admin to enable courses/reports module").
- Avoid hard-blocking entire pages when secondary lookups fail; degrade gracefully where possible.

## 2) Module-aware visibility alignment

- Ensure navigation/menu and page actions match backend permission model for:
  - courses-linked lookups (majors/classes)
  - attendance/report views.

## HTTPS Image Rendering Plan

## 1) Enforce same-origin/proxied image URLs

Target utility:

- `web/src/utils/publicUploadUrl.ts`

Plan:

- Normalize relative upload paths (e.g. `/uploads/...`) to frontend same-origin URL in HTTPS contexts.
- Avoid rendering absolute insecure `http://...` image URLs when page is HTTPS.
- Route images through frontend host (via rewrite/proxy) similar to `/api` strategy.

## 2) Hosting rewrite alignment

- Ensure deployment config rewrites `/uploads/*` to backend static host over server-side proxy.
- Keep browser requests HTTPS and same-origin.

## Web Testing Plan

1. **Camera capture (mobile emulation):**
   - clicking avatar opens camera-capable picker.
2. **Desktop camera fallback:**
   - capture flow creates preview and uploads successfully.
3. **Permission denied case:**
   - user gets clear fallback message and can still upload manually.
4. **Staff role access:**
   - staff with modules can load majors/classes/attendance-backed screens.
   - staff without modules gets consistent not-authorized messaging.
5. **Image loading on HTTPS:**
   - no mixed-content errors in browser console.
   - uploaded images render in student/profile lists.

## Delivery Phases

### Phase 1 (must-have)

- Click-avatar camera/file capture behavior.
- HTTPS-safe image URL handling.
- Staff-facing graceful handling for majors/classes/attendance access responses.

### Phase 2 (should-have)

- In-modal camera preview and retake UX polish.
- Better image compression before upload.

## Acceptance Criteria

1. User can click default student image and capture photo directly from device camera.
2. Captured image uploads through existing endpoint and appears immediately in UI.
3. `school_staff` no longer hits unexplained 403 blockers for approved modules/features.
4. No profile/student image is blocked by mixed-content on HTTPS deployment.
