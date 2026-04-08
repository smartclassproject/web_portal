# E2E tests (Playwright)

Tests use credentials from **`web/.env.local`**:

- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`
- `SCHOOL_ADMIN_EMAIL`, `SCHOOL_ADMIN_PASSWORD`
- `TEACHER_EMAIL`, `TEACHER_PASSWORD`

## Prerequisites

1. **Backend** and **web app** must be running. `.env.local` must exist; users must exist in the database.
2. **If the dev server shows a Vite error overlay** (e.g. "Cannot find module...") instead of the login form, run tests against the **production build** so the login page loads:
   ```bash
   pnpm build && pnpm preview
   ```
   Then in another terminal:
   ```bash
   PLAYWRIGHT_BASE_URL=http://localhost:4173 pnpm test:e2e
   ```
   (Preview serves on port 4173 by default.)

## Commands (from `web/`)

- **`pnpm screenshots`** — Playwright **starts the Vite dev server** on port 5173 if nothing is already running, then captures screenshots. You only need the **backend** running (API).  
  If you see a Vite error overlay instead of the login page, use preview instead:  
  `pnpm build && pnpm preview` then  
  `PLAYWRIGHT_BASE_URL=http://localhost:4173 PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm screenshots`

- **Run all portal tests** (`pnpm test:e2e`): same auto-start on 5173 unless you set `PLAYWRIGHT_BASE_URL` / `PLAYWRIGHT_SKIP_WEB_SERVER=1`.

- **Install Chromium** (once):  
  `npx playwright install chromium`
