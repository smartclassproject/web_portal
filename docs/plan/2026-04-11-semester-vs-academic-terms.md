# Plan: **Semester** (registration) vs **terms** (exams & reports)

*Updated: 2026-04-11*

## Vocabulary (product rule — locked)

| Word | Where it is used | Meaning |
|------|------------------|---------|
| **Semester** | **Student registration** (add/edit student) | Enrollment / intake timing in the **calendar sense**, e.g. **Fall 2026**, **Spring 2027**. Do **not** use “term” on the registration form for this. |
| **Term(s)** | **Exams, marks, report cards**, school-year structure | **Grading periods** within an academic year (e.g. 2 or 3 **terms** to complete a year). UI and copy for exams/reports should say **term**, not semester. |

A school can have **3 terms** for exams/reports while students enroll in a **Fall** or **Spring** **semester** — the two ideas stay separate.

---

## Problem (technical today)

`Student.semester` is currently an integer **1…`School.numberOfTerms`**, which is really a **term index**, not an enrollment semester. That confuses registration language with exam/report language.

**Direction:** Persist **enrollment semester** data on the student (season + cohort year or equivalent) under clear **semester** naming in API/UI, and persist **term** position separately (e.g. which term they started in or are in for reporting), validated against **`School.numberOfTerms`**.

---

## School admin: both must be configurable

School admins need to be able to **change settings** that drive both concepts (not only hard-coded defaults).

### A. Terms (exams & reports)

- [ ] **`numberOfTerms`** (or renamed in UI only to **“Terms per academic year”**) remains the main lever: **2–6** (existing cap).
- [ ] **Where:** `SchoolSettingsPage` + **`PUT /api/schools/my-school`** (already partially there).
- [ ] Optional later: **custom term labels** (e.g. “Trimester 1”) stored on `School` if product wants named terms beyond “Term 1…N”.

### B. Semester (registration / intake)

- [ ] School-level config so registration options match each school’s calendar, e.g.:
  - **Which enrollment semesters are offered:** toggles or multi-select for **Fall / Spring / Summer / Winter** (subset as needed).
  - Optional: **default semester** for new students (prefill on form).
  - Optional: **cohort year** bounds or guidance (min/max year for dropdowns) — only if product needs it.
- [ ] **Where:** same **School settings** area (extend `School` model + `SchoolSettingsPage` + `updateMySchool`), or a dedicated “Academic calendar” subsection — **one place** school admins expect.
- [ ] **API:** extend **`GET/PUT /api/schools/my-school`** (and super-admin school update if mirrors) with new fields, validated (e.g. at least one semester enabled if required).

### C. Student record (after admin configures school)

- [ ] At **registration**, student picks a **semester** (from school-allowed list) + cohort year (e.g. Fall **2026**).
- [ ] Separately, student has a **term** field (integer **1…`numberOfTerms`**) for exams/reports alignment — label everywhere **“Term”**, never “semester”.

---

## Data model (backend) — indicative

### `School`

| Field (indicative) | Purpose |
|--------------------|--------|
| `numberOfTerms` | Count of **terms** per year (exams/reports). Admin editable. |
| `enrollmentSemestersEnabled` | e.g. `['fall','spring']` — which **semesters** appear on registration. Admin editable. |
| Optional: `defaultEnrollmentSemester`, `termLabels[]` | Product-driven. |

### `Student`

| Field (indicative) | Purpose |
|--------------------|--------|
| `enrollmentSemester` or `enrollmentSeason` + `enrollmentCohortYear` | **Semester** at registration (Fall 2026). Must match school-allowed set. |
| `entryTerm` or `currentTerm` (rename from misleading `semester`) | **Term** index 1…N for exams/reports. Validate vs `school.numberOfTerms`. |

**Migration:** Map legacy **`student.semester`** (1…N) → **`entryTerm`** (or chosen name); add new **semester** enrollment fields; stop using `semester` key for term index after cutover (or keep one-release alias in API — product choice).

---

## API & validation

- [ ] **School:** `GET/PUT my-school` returns and accepts **term count** + **enabled enrollment semesters** (+ optional extras).
- [ ] **Student POST/PUT:** Body uses **`entryTerm`** (or final name) + **semester** fields; validate semester ∈ school config and term ∈ `1…numberOfTerms`.
- [ ] Deprecate ambiguous **`semester`** on student with documented mapping period.

---

## Web app

### Registration (`AddStudentModal`)

- [ ] Section **“Semester (enrollment)”** — season + year (or single control “Fall 2026”); options from **school** config.
- [ ] Section **“Term”** — dropdown **Term 1 … Term N** with helper: *“Used for exams and report cards this academic year.”*
- [ ] Never label the term dropdown as “semester”.

### School settings (`SchoolSettingsPage`)

- [ ] **Terms:** configure **number of terms per year** (exams/reports); clear copy.
- [ ] **Semesters:** configure **which enrollment semesters** students can be assigned (and optional defaults).

### Lists / PDF / teacher flows

- [ ] Show **semester** (enrollment) and **term** as separate columns where useful.
- [ ] Report cards / term results: use **term** only in copy and logic tied to `numberOfTerms`.

---

## Downstream checklist

- [ ] Grep **`semester`** in teacher/report-card code paths; split **term** vs **enrollment semester** after schema split.
- [ ] Parent/student apps: align wording.

---

## Migration (phased)

1. [ ] Add `School` + `Student` fields; API accepts both; UI uses new labels.
2. [ ] Backfill: old `student.semester` → **term** field; backfill enrollment semester from `academicYear` + default **fall** where missing.
3. [ ] Remove deprecated `student.semester` after cutover.

---

## Testing

- [ ] School admin disables **Spring** → registration form must not offer Spring.
- [ ] School admin sets **2 terms** → student term dropdown max 2; exams/report UIs respect 2.
- [ ] New student: **Fall 2026** + **Term 1**; edit to **Spring 2027** + **Term 2** without cross-validation bugs.

---

## Sign-off (before build)

- [ ] Exact **`School`** field names and defaults for “enabled semesters.”
- [ ] **`entryTerm` vs `currentTerm`** and whether it updates over the school year or is enrollment-only.

---

## File map (indicative)

| Area | Files |
|------|--------|
| School schema + my-school | `backend/models/School.js`, `backend/controllers/schools.js`, `backend/routes/schools.js` |
| Student schema + CRUD | `backend/models/Student.js`, `backend/controllers/students.js`, `backend/routes/students.js` |
| Settings UI | `web/src/pages/school/SchoolSettingsPage.tsx`, `web/src/services/schoolService.ts` |
| Registration | `web/src/components/forms/AddStudentModal.tsx`, `web/src/pages/school/StudentsPage.tsx`, `web/src/types/index.ts`, `web/src/services/studentService.ts` |
| Reports / exams | `web/src/pages/teacher/*`, `web/src/pages/school/ReportCardsPage.tsx` (verify) |

---

*Semester = registration only. Terms = exams & reports only. School admin configures both via school settings.*
