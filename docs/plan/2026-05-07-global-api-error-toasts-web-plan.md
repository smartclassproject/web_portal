# Web Plan: Global API Error Toasts

## Goal

When any API call made through the shared `axiosInstance` fails, the user should see a **toast** with a useful message (server `message`, validation `errors`, or a clear network/status fallback), unless that request opts out to avoid duplicate or conflicting UI.

## Problems Addressed

1. Many pages used generic copy such as “Failed to create course. Please try again.” and ignored `response.data.message` (e.g. `Access denied - insufficient permissions`, validation errors).
2. Failure handling was inconsistent across school modules (courses, schedules, students, etc.).

## Approach

### 1) Central error toast in `axiosInstance`

File: `web/src/services/axiosInstance.ts`

- In the **response error** interceptor, after existing token-expiry handling:
  - If not skipping (see below), call `toast.error(getApiErrorMessage(error))`.
  - Only run in the browser (`typeof window !== 'undefined'`).

### 2) Message extraction helper

File: `web/src/utils/apiErrorMessage.ts`

- Prefer `response.data.message` when present.
- If `response.data.errors` is an array (e.g. express-validator), join the first few entries.
- Network failures: clear “check your connection” message.
- Sensible fallbacks for 401 / 403 / 404 when body has no `message`.

### 3) When **not** to toast globally

Avoid double toasts or conflicting patterns:

| Mechanism | Use case |
|-----------|----------|
| URL prefix skip | `/api/auth/login` — `AuthContext` already shows success/error toasts. |
| URL prefix skip | `/api/auth/setup-password`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/teacher/set-password` — dedicated pages toast errors inline. |
| URL prefix skip | `/api/auth/profile` (GET/PATCH/PUT/POST photo/password) — account pages already toast with server `message`. |
| `skipErrorToast: true` on `AxiosRequestConfig` | Any future call where the caller owns the full error UX (optional escape hatch). |

TypeScript: `web/src/types/axios.d.ts` augments `AxiosRequestConfig` with optional `skipErrorToast`.

### 4) Remove redundant local `toast.error` after failed API calls

Where a `catch` only duplicated what the interceptor now shows, remove the duplicate **for API failures** only. Keep:

- Client-side validation toasts (before any request).
- **Success** toasts (`toast.success`).
- `console.error` for debugging if desired.

Initial sweep targeted high-traffic school flows: courses list/modals, schedules list/modal, student CRUD/import paths that mirrored API messages.

## Out of Scope (later)

- Replacing every remaining duplicate toast across admin/teacher/student pages in one pass.
- Toast styling or positioning changes (reuse existing `react-toastify` setup).
- Non-axios clients (if any).

## Acceptance Criteria

1. Failed `POST /api/courses` (or similar) shows the backend `message` in a toast without requiring each page to parse `response.data`.
2. Login and profile/account flows do **not** show two error toasts for the same failure.
3. Token-expiry redirect behavior remains unchanged; no extra error toast right before redirect.

## Files Touched (implementation)

- `web/src/services/axiosInstance.ts` — error interceptor + skip rules.
- `web/src/utils/apiErrorMessage.ts` — message parsing.
- `web/src/types/axios.d.ts` — `skipErrorToast` typing.
- `web/src/components/layout/DashboardLayout.tsx` — single `ToastContainer` for all school dashboard routes (so interceptor toasts render on courses/schedules pages that previously had no container).
- School pages that nested `ToastContainer` inside `DashboardLayout` — removed duplicates (`StudentsPage`, `ClassesPage`, account pages, fees, inquiries, announcements).
- Selected pages/components — drop redundant `toast.error` in API `catch` blocks where covered globally (courses, schedules/modal, students import CRUD paths, fees bulk update).
