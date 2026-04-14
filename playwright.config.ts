import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

// Load .env.local/.env so tests can use SUPER_ADMIN_EMAIL, SCHOOL_ADMIN_EMAIL, TEACHER_EMAIL, etc.
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
/** Start Vite automatically when using default port (so `pnpm screenshots` works without a separate terminal). */
const startDevServer =
  !process.env.PLAYWRIGHT_SKIP_WEB_SERVER &&
  (baseURL.includes('5173') || baseURL.includes('localhost:5173'));

/**
 * Playwright config for RiseMe web app.
 * Credentials from web/.env.local (SUPER_ADMIN_*, SCHOOL_ADMIN_*, TEACHER_*).
 * Run: pnpm screenshots | pnpm test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    viewport: { width: 1280, height: 720 },
  },
  ...(startDevServer && {
    webServer: {
      command: 'pnpm exec vite --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  }),
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
