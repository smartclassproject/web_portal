/**
 * Tests all three portals: Super Admin, School Admin, Teacher.
 * Uses credentials from web/.env.local:
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
 *   SCHOOL_ADMIN_EMAIL, SCHOOL_ADMIN_PASSWORD
 *   TEACHER_EMAIL, TEACHER_PASSWORD
 *
 * Run from web/: pnpm test:e2e
 */
import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('All portals', () => {
  test.setTimeout(30000);
  test('Super Admin: login and dashboard', async ({ page }) => {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await login(page, email, password);
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Super Admin: schools page loads', async ({ page }) => {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await login(page, email, password);
    await expect(page).toHaveURL(/\/admin\//);
    await page.goto('/admin/schools');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /schools/i })).toBeVisible();
  });

  test('School Admin: login and dashboard', async ({ page }) => {
    const email = process.env.SCHOOL_ADMIN_EMAIL;
    const password = process.env.SCHOOL_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await login(page, email, password);
    await expect(page).toHaveURL(/\/school/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('School Admin: students page loads', async ({ page }) => {
    const email = process.env.SCHOOL_ADMIN_EMAIL;
    const password = process.env.SCHOOL_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await login(page, email, password);
    await expect(page).toHaveURL(/\/school\//);
    await page.goto('/school/students');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /students/i })).toBeVisible();
  });

  test('Teacher: login and dashboard', async ({ page }) => {
    const email = process.env.TEACHER_EMAIL;
    const password = process.env.TEACHER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await login(page, email, password);
    await expect(page).toHaveURL(/\/teacher/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Teacher: term results page loads', async ({ page }) => {
    const email = process.env.TEACHER_EMAIL;
    const password = process.env.TEACHER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await login(page, email, password);
    await expect(page).toHaveURL(/\/teacher\//);
    await page.goto('/teacher/term-results');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/term|results|course/i)).toBeVisible();
  });
});
