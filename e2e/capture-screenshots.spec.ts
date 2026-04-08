/**
 * Captures screenshots for docs/ppt.md — School Admin (02–09) + Teacher portal (10–16).
 * .env.local: SCHOOL_ADMIN_EMAIL/PASSWORD, TEACHER_EMAIL/PASSWORD.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/screenshots');
const SCHOOL_EMAIL = process.env.SCHOOL_ADMIN_EMAIL;
const SCHOOL_PASSWORD = process.env.SCHOOL_ADMIN_PASSWORD;

test.describe('Capture screenshots for school admin PPT', () => {
  test('01 login (public page)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login.png'), fullPage: true });
  });

  test.describe('School admin pages (authenticated)', () => {
    test.setTimeout(90000); // first login / cold backend may be slow
    test.beforeEach(async ({ page }) => {
      if (!SCHOOL_EMAIL || !SCHOOL_PASSWORD) {
        test.skip();
        return;
      }
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(SCHOOL_EMAIL);
      await page.getByLabel(/password/i).fill(SCHOOL_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      // Wait for redirect (backend must be reachable at the app's API URL)
      try {
        await page.waitForURL(/\/(school|admin)\//, { timeout: 30000 });
      } catch {
        const err = await page.getByRole('alert').or(page.locator('.text-red-500, .bg-red-100')).textContent().catch(() => '');
        throw new Error(`Login did not redirect. ${err ? `Page message: ${err.slice(0, 200)}` : 'Check backend is running and .env.local credentials exist in the database.'}`);
      }
      await page.waitForLoadState('domcontentloaded');
    });

    test('02 school dashboard', async ({ page }) => {
      await page.goto('/school/dashboard');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-school-dashboard.png'), fullPage: true });
    });

    test('03 students', async ({ page }) => {
      await page.goto('/school/students');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-students.png'), fullPage: true });
    });

    test('04 teachers', async ({ page }) => {
      await page.goto('/school/teachers');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-teachers.png'), fullPage: true });
    });

    test('05 classes', async ({ page }) => {
      await page.goto('/school/classes');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-classes.png'), fullPage: true });
    });

    test('06 schedules', async ({ page }) => {
      await page.goto('/school/schedules');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-schedules.png'), fullPage: true });
    });

    test('07 attendance', async ({ page }) => {
      await page.goto('/school/attendance');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-attendance.png'), fullPage: true });
    });

    test('08 report cards', async ({ page }) => {
      await page.goto('/school/report-cards');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-report-cards.png'), fullPage: true });
    });

    test('09 settings', async ({ page }) => {
      await page.goto('/school/settings');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-settings.png'), fullPage: true });
    });
  });

  test.describe('Teacher portal (authenticated)', () => {
    test.setTimeout(90000);
    const TEACHER_EMAIL = process.env.TEACHER_EMAIL;
    const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD;

    test.beforeEach(async ({ page }) => {
      if (!TEACHER_EMAIL || !TEACHER_PASSWORD) {
        test.skip();
        return;
      }
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(TEACHER_EMAIL);
      await page.getByLabel(/password/i).fill(TEACHER_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      try {
        await page.waitForURL(/\/teacher\//, { timeout: 30000 });
      } catch {
        throw new Error('Teacher login did not redirect to /teacher/. Check TEACHER_EMAIL / TEACHER_PASSWORD in .env.local.');
      }
      await page.waitForLoadState('domcontentloaded');
    });

    test('10 teacher dashboard', async ({ page }) => {
      await page.goto('/teacher/dashboard');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-teacher-dashboard.png'), fullPage: true });
    });

    test('11 teacher calendar', async ({ page }) => {
      await page.goto('/teacher/calendar');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-teacher-calendar.png'), fullPage: true });
    });

    test('12 teacher exams', async ({ page }) => {
      await page.goto('/teacher/exams');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-teacher-exams.png'), fullPage: true });
    });

    test('13 teacher lessons', async ({ page }) => {
      await page.goto('/teacher/lessons');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-teacher-lessons.png'), fullPage: true });
    });

    test('14 teacher materials', async ({ page }) => {
      await page.goto('/teacher/materials');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-teacher-materials.png'), fullPage: true });
    });

    test('15 teacher students', async ({ page }) => {
      await page.goto('/teacher/students');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-teacher-students.png'), fullPage: true });
    });

    test('16 teacher term results', async ({ page }) => {
      await page.goto('/teacher/term-results');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-teacher-term-results.png'), fullPage: true });
    });
  });
});
