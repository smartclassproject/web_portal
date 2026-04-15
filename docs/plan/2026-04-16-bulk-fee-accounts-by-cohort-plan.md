# Plan: Bulk fee accounts (all students or by intake cohort)

**Scope:** School web `FeesPage.tsx` — extend fee assignment so admins can set the same **total amount due (RWF)** for **many students** in one flow: **all eligible students** and/or students in a specific **intake cohort** expressed as **Fall 2026**, **Spring 2025**, etc. (enrollment season + cohort year).

**This bulk flow does *not* use academic year or term** in the UI or API contract. Cohort is defined only by **`enrollmentSeason`** + **`enrollmentCohortYear`** on `Student`, matching how registrations are grouped (e.g. “Fall 2026”).

**Out of scope for v1:** Parent/student app changes; email notifications.

---

## Current behavior (baseline)

- **Single student** modal on `FeesPage`: `studentId`, `totalAmountDue`, plus **academic year** and **term** today → `POST /api/fees/accounts` → `upsertFeeAccount` in `backend/controllers/fees.js`.
- **`StudentFeeAccount`** today uses **`academicYear`** and **`term`** in its unique index `{ schoolId, studentId, academicYear, term }` (`backend/models/StudentFeeAccount.js`). Bulk cohort work **must** either map cohort to storage or **extend the schema** (see below).
- **Students** have **`enrollmentSeason`** (`fall` | `spring` | `summer` | `winter`) and **`enrollmentCohortYear`** (e.g. 2026) for labels like **Fall 2026** (`backend/models/Student.js`, registration in `students.js`).

---

## Goals

1. **All students (school scope)**  
   Apply one **total amount due (RWF)** to every **active** student in the school (with optional guardrails).

2. **By intake cohort (Fall 2026, Spring 2025, …)**  
   Apply the same amount to students where **`enrollmentSeason`** and **`enrollmentCohortYear`** both match the admin’s selection (display: **“Fall 2026”** = season `fall` + cohort year `2026`).

3. **Preview + confirm**  
   Show **count** and a **sample list** (e.g. first 20: name, student ID, cohort label); warn when **cohort mode** is chosen but a student is missing `enrollmentSeason` or `enrollmentCohortYear` (exclude or show in “skipped” list).

4. **Idempotent bulk apply**  
   Re-running the same bulk cohort operation **updates** the same logical fee row for each student (no duplicate-key errors).

---

## UX design (web)

### Entry points on `FeesPage`

- Keep **single-student** “Create or update student fee account” as today (can still use academic year / term there until that modal is redesigned separately).
- Add **“Bulk fee assignment”** (wizard or large modal):
  1. **Who**
     - **All active students** in this school.
     - **By intake cohort** — two controls (or one composed control):
       - **Season:** Fall / Spring / Summer / Winter  
       - **Cohort year:** e.g. `2026`, `2025` (integer)  
       - Live label: **“Fall 2026”**, **“Spring 2025”**, etc.
     - *(Optional later)* **Custom multi-select** from a paginated student list.
  2. **What**  
     - **Total amount due (RWF)** only (and optional **currency**, default RWF).  
     - **No academic year field. No term field** for this bulk flow.
  3. **Preview** — count + table snippet; list skipped students with reasons (inactive, wrong school, missing cohort fields).
  4. **Confirm** — **“Apply to N students”**; progress for large N if needed.

### Copy / validation

- Explain that **amounts already paid** on the affected fee rows stay as stored; **due** updates and **balance** / **status** follow model rules.
- If **N = 0**, block submit (e.g. “No active students” or “No students for **Fall 2026**”).
- Cohort mode: require **both** season and cohort year so the label is always unambiguous.

---

## Backend design

### API: `POST /api/fees/accounts/bulk` (recommended)

**Body (example) — no `academicYear` / `term`:**

```json
{
  "mode": "ALL_ACTIVE" | "COHORT",
  "enrollmentSeason": "fall",
  "enrollmentCohortYear": 2026,
  "onlyActive": true,
  "totalAmountDue": 500000,
  "currency": "RWF"
}
```

- **`ALL_ACTIVE`:** `Student.find({ schoolId, isActive: true })` (respect `onlyActive` if you add inactive mode later).
- **`COHORT`:** require `enrollmentSeason` + `enrollmentCohortYear`; query  
  `Student.find({ schoolId, enrollmentSeason, enrollmentCohortYear, ... })`  
  (normalize season to lowercase).

### Persisting without academic year / term in the product

Today’s **`StudentFeeAccount`** uniqueness is tied to **`academicYear`** and **`term`**. Pick **one** implementation path and document it in the ticket:

| Approach | Summary |
|----------|---------|
| **A. Schema + index (clean)** | Add **`enrollmentSeason`** + **`enrollmentCohortYear`** (or a single string **`cohortKey`**, e.g. `fall-2026`) to `StudentFeeAccount`, unique with `(schoolId, studentId, cohortKey)` or `(schoolId, studentId, enrollmentSeason, enrollmentCohortYear)`. Stop requiring academic year/term for cohort-scoped fees. Migrate or backfill existing rows if needed. |
| **B. Internal mapping (interim)** | Keep DB fields for one release: e.g. set **`academicYear = enrollmentCohortYear`** and **`term = 1`** (or school default) **only inside the server** when applying bulk cohort fees — **not** exposed in bulk UI. Risk: collides with real “Term 1 / same academic year” fee rows; use only if product accepts that until A ships. |

**Recommendation:** Plan for **A**; if schedule is tight, document **B** as a short-lived bridge with explicit risks.

**Response:** `{ applied, failed: [{ studentId, reason }], skipped }` as in the earlier plan.

**Guards:** max students per request, school scope, `school_admin` only.

---

## Web implementation tasks

| # | Task |
|---|------|
| 1 | `feesService.bulkUpsertFeeAccounts(payload)` — cohort fields + amount only (no year/term in payload). |
| 2 | `FeesPage` bulk UI: season + cohort year → **Fall 2026** preview label; amount; preview; confirm. |
| 3 | Reuse **`formatRwf`** in preview. |
| 4 | On success: toast + refresh accounts list; optional “Updated N accounts for **Fall 2026**”. |
| 5 | Optional: show **cohort column** on fee accounts table (populate `enrollmentSeason` / `enrollmentCohortYear` on `studentId`). |

---

## Testing checklist

- **Cohort Fall 2026:** only students with `enrollmentSeason === 'fall'` and `enrollmentCohortYear === 2026`.
- **All active:** count matches DB.
- **Zero matches:** validation blocks submit.
- Re-run same bulk: updates due, no duplicate errors (per chosen storage approach).
- Payments unchanged on affected accounts; balance/status still correct.
- Unauthorized role cannot call bulk endpoint.

---

## Rollout order

1. Backend: cohort query + bulk endpoint + **StudentFeeAccount** strategy (**A** or documented **B**).
2. Web: bulk modal + service.
3. Optional: align single-student modal later to cohort vocabulary and deprecate year/term in UI if schema moves to cohort-only.

---

## Open questions (product)

- **“All students”:** active only vs include inactive?
- Students **missing** `enrollmentCohortYear` or `enrollmentSeason`: always **skip** with reason, or allow admin to “assign to unassigned” in a separate action?
- Single-student modal: keep academic year/term until schema supports cohort-only accounts, or migrate both flows together?

---

## References

- `web/src/pages/school/FeesPage.tsx` — account modal.
- `backend/controllers/fees.js` — `upsertFeeAccount`, `getFeeAccounts`.
- `backend/models/StudentFeeAccount.js` — current unique index.
- `backend/models/Student.js` — `enrollmentSeason`, `enrollmentCohortYear`.
