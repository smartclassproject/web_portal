# SmartClass web — HTTPS mixed-content incident and fix

This note documents the production issue where `https://smartclass-two.vercel.app` could not load dashboard data because API calls were blocked or failing.

---

## What failed

- Frontend host: `https://smartclass-two.vercel.app`
- API configured in Vercel env: `VITE_BACKEND_URL=http://41.186.188.119:5000`
- Browser blocked requests from HTTPS page to HTTP API (mixed content), including:
  - `/api/auth/login`
  - `/api/students/students`
  - `/api/teachers/teachers`
  - `/api/devices/school/devices`
  - `/api/attendance/school/attendance`

Observed browser error:

- `Mixed Content: ... requested an insecure XMLHttpRequest endpoint 'http://41.186.188.119:5000/...'`

---

## Root causes

1. **Protocol mismatch:** HTTPS frontend directly calling HTTP backend.
2. **TLS mismatch on IP endpoint:** direct `https://41.186.188.119:5000` was not a stable browser TLS target.
3. **Path composition bug during fallback:** temporary `/api/api/...` requests produced 404 for login.

---

## Fix implemented

### 1) Add Vercel rewrite proxy

File: `web/vercel.json`

- Added rewrite:
  - `source: /api/(.*)`
  - `destination: http://41.186.188.119:5000/api/$1`

This lets the browser call same-origin HTTPS URLs (`https://smartclass-two.vercel.app/api/...`) while Vercel forwards server-side to backend HTTP.

### 2) Harden axios base URL handling

File: `web/src/services/axiosInstance.ts`

- Added HTTPS safety fallback:
  - If page is HTTPS and `VITE_BACKEND_URL` starts with `http://`, ignore it.
  - Use same-origin routing for API calls.
- Added defensive logging:
  - Request/response/error traces behind `VITE_DEBUG_API=true`.
  - Warning when insecure configured backend URL is ignored.
- Fixed fallback path logic to prevent duplicated `/api/api/...`.

---

## Required environment behavior

- `VITE_BACKEND_URL` can remain set to `http://41.186.188.119:5000` and frontend will ignore it on HTTPS pages due to safeguard.
- Recommended cleaner config:
  - set `VITE_BACKEND_URL=/api`
  - or unset it so fallback applies automatically on HTTPS.

---

## Verification performed

1. Ran browser automation (Playwright) against production host.
2. Logged failed requests and console errors during login/dashboard navigation.
3. Confirmed final successful state:
   - Final URL reached: `https://smartclass-two.vercel.app/school/dashboard`
   - No mixed-content console errors.
   - Dashboard API calls returned HTTP `200` via same-origin:
     - `/api/students/students?page=1&limit=1000`
     - `/api/teachers/teachers?page=1&limit=1000`
     - `/api/devices/school/devices?page=1&limit=1000`
     - `/api/attendance/school/attendance?page=1&limit=100`

Proof artifact:

- Screenshot: `web/e2e/school-dashboard-working.png`

---

## Commits related to this fix

- `00265bf` — route API calls through Vercel proxy and add debug logs.
- `0872f5a` — ignore insecure HTTP backend URL on HTTPS pages.
- `fc86416` — avoid duplicate `/api` prefix on HTTPS fallback.

---

## Quick rollback/triage checklist

If issue reappears:

1. Check deployed frontend bundle includes latest commit.
2. Open browser console and verify no mixed-content entries.
3. Confirm network requests are to `https://smartclass-two.vercel.app/api/...` (not direct `http://41.186.188.119:5000/...`).
4. Verify Vercel rewrite in `vercel.json` exists in deployed project.
5. Enable `VITE_DEBUG_API=true` and inspect axios logs for request URL and response status.
