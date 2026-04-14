# SmartClass — implementation plan

This document lists work agreed for students, uploads, IDs, and account profiles. Update checkboxes as items ship.

---

## 1. Student profile photos (server + web)

- [ ] **Backend:** `POST` endpoint accepting `multipart/form-data` (e.g. field `photo`) using **multer**, saving under `uploads/students/`, returning a **public path** (e.g. `/uploads/students/...`) consistent with existing `express.static('/uploads', ...)`.
- [ ] **Backend:** On student **create/update**, accept optional `profileUrl` (set from upload response or omitted).
- [ ] **Web:** `AddStudentModal` — **profile = image upload only** (remove manual “Profile URL” text field). Upload file before or as part of submit; send resulting URL in create/update payload.
- [ ] **Web:** Use **FormData** for the upload request; do **not** force `Content-Type: application/json` on that call (let the browser set multipart boundary). Reuse or extend `axiosInstance` / a small `uploadFile` helper as needed.
- [ ] **Web:** When displaying images, prefix relative `/uploads/...` URLs with `VITE_BACKEND_URL` (or equivalent) so images load from the API host.

---

## 2. Auto-generated Student ID (backend)

- [ ] **Format:** `{SCHOOL_SHORT}{yy}{3_random_digits}{3_random_letters}` (e.g. `KGSY26042ABK`). Letters uppercase; avoid ambiguous characters if desired (optional refinement).
- [ ] **School short code:** Add **`School.shortCode`** (or similar), editable by school admin in school settings; use it in ID generation. If missing, derive a short code from school name (document the fallback).
- [ ] **Generation:** Implement `generateUniqueStudentId(school)` with collision checks against `Student.studentId`.
- [ ] **Schema:** Increase **`studentId` max length** in the Student model if the pattern can exceed the current limit.
- [ ] **`createStudent`:** For **school_admin** (and product rules for other roles), **do not require** `studentId` in the body — generate server-side. Optionally ignore client-supplied `studentId` for school_admin to prevent tampering.
- [ ] **`updateStudent`:** **Do not allow changing** `studentId` after create (or restrict to super_admin only — document decision).
- [ ] **Routes / validators:** `studentId` **optional** on POST where auto-generation applies; keep uniqueness and format validation where IDs are still accepted (e.g. super-admin flows if any).

---

## 3. Add-student form fields (web + API alignment)

Ensure the add (and edit) student UX and API support:

| Field | Notes |
|--------|--------|
| Full Name | Required |
| Student ID | **Read-only / assigned after save** on add; show value returned from API |
| Gender | New or mapped enum/string on Student model |
| Date of Birth | Existing validation (age window) |
| Major | Existing `majorId` |
| Class | Existing `classId` / class name resolution |
| Academic Year | Map to new field **`academicYear`** and/or existing **`enrollmentYear`** — pick one source of truth and document |
| Semester | New field **`semester`** (1–N aligned with `School.numberOfTerms` if useful) |
| Email | Optional/required per product |
| Phone | Optional |
| Is Active | Yes/No → boolean |
| Profile photo | Upload only (see §1) |
| RFID **Card ID** | Keep if hardware/attendance still depends on it; clarify in UI |
| **Parent first name** | Optional; `parentFirstName` |
| **Parent last name** | Optional; `parentLastName` |
| **Parent phone** | Optional; `parentPhoneNumber` — used for parent portal when provided |

- [ ] **Backend:** Extend Student schema + create/update controllers and validators for **gender**, **semester**, **academicYear** (and any renames).
- [ ] **Web:** Refactor `AddStudentModal` to match the table; remove only redundant fields (**manual Student ID**, **manual Profile URL**). **Keep parent / guardian fields** on add and edit (registration must still collect parent information when the school chooses to).
- [ ] **Web:** Align `studentService` types and list/detail pages with new API shape.

---

## 4. School settings (short code)

- [ ] **Backend:** `GET/PUT` my-school (or school update) includes **`shortCode`** with validation (length, charset, uniqueness per school if required).
- [ ] **Web:** `SchoolSettingsPage` (or equivalent) — field for **school short code** with helper text (“used in student IDs”).

---

## 5. Account / profile for roles

### 5.1 School admin

- [ ] **Page:** e.g. `/school/account` — sections: **school summary** (name, location, short code, terms), **personal profile** (name, phone, photo), **security** (change password: current + new).
- [ ] **Backend:** Authenticated **GET/PATCH profile** for admin user; include **populated `school`** when `school_admin`.
- [ ] **Backend:** **PUT change-password** (current password, new password) for `AdminUser`.

### 5.2 Teacher

- [ ] **Page:** e.g. `/teacher/account` — **school**, **Teacher** profile (name, email, phone, department, photo), **credentials** (change password for `TeacherUser`).
- [ ] **Backend:** Profile endpoints resolve `req.user.teacherId` → **Teacher** + **School**; PATCH updates Teacher fields; password updates `TeacherUser`.

### 5.3 Super admin / admin (global)

- [ ] **Page:** e.g. `/admin/account` — profile + change password (no school, or empty school section).
- [ ] **Backend:** Same profile/password pattern for `super_admin` / `admin` as applicable to your auth model.

### 5.4 Profile photo (staff)

- [ ] **Backend:** Optional `POST /api/auth/profile-photo` (or under `/api/admins/...`) with multer → `uploads/profiles/`, return public path.
- [ ] **Models:** Add **`profileUrl`** to **AdminUser** if not present; **Teacher** already may have it — keep single source for teacher portrait on **Teacher** document.

---

## 6. Testing & hardening

- [ ] Manual: create student with photo, verify `profileUrl` in DB and image in browser.
- [ ] Manual: verify generated `studentId` format and uniqueness across several creates.
- [ ] Manual: school admin / teacher account pages load school + profile; password change errors (wrong current password) handled.
- [ ] Optional: Playwright or API tests for upload + create student.

---

## 7. Documentation

- [ ] Keep this file updated when scope changes.
- [ ] Brief **API** note in README or Swagger for new routes (upload, profile, password).

---

## File / area map (reference)

| Area | Likely paths |
|------|----------------|
| Student form | `web/src/components/forms/AddStudentModal.tsx` |
| Student API client | `web/src/services/studentService.ts` (or similar) |
| HTTP client | `web/src/services/axiosInstance.ts` |
| Student CRUD + upload | `backend/controllers/students.js`, `backend/routes/students.js` |
| Student model | `backend/models/Student.js` |
| School model / my-school | `backend/models/School.js`, `backend/controllers/schools.js` |
| ID helper | `backend/utils/studentIdGenerator.js` (new) |
| Multer middleware | `backend/middlewares/uploadStudentPhoto.js`, `uploadProfilePhoto.js` |
| Auth / profile | `backend/routes/auth.js`, `backend/controllers/auth.js` (+ new `profile` controller if split) |
| Staff models | `backend/models/AdminUser.js`, `backend/models/Teacher.js`, `backend/models/TeacherUser.js` |

---

*Last updated: 2026-04-11 — parent/guardian fields remain on student registration (add + edit). Plan file naming: `YYYY-MM-DD-<short-description>.md`.*
