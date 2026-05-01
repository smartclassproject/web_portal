import { test, expect, type Page } from '@playwright/test';

const STAFF_EMAIL = process.env.MATRON_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.MATRON_STAFF_PASSWORD;

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function loginAsMatron(page: Page) {
  test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'MATRON_STAFF_EMAIL and MATRON_STAFF_PASSWORD are required');
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(STAFF_EMAIL!);
  await page.getByLabel(/password/i).fill(STAFF_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/school\/|\/not-authorized/, { timeout: 30000 });
}

async function selectFirstRealOption(page: Page, selector: string) {
  const firstRealValue = await page
    .locator(selector)
    .locator('option')
    .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value).find((v) => v && v.trim().length > 0) || '');
  expect(firstRealValue).not.toBe('');
  await page.locator(selector).selectOption(firstRealValue);
}

test.describe('Matron create student and teacher', () => {
  test.setTimeout(180_000);

  test('create student as matron', async ({ page }) => {
    await loginAsMatron(page);
    await page.goto('/school/students');
    await expect(page).toHaveURL(/\/school\/students/);

    const suffix = unique();
    const studentName = `PW Matron Student ${suffix}`;
    const studentEmail = `pw.matron.student.${suffix}@example.com`;

    const addBtn = page.getByRole('button', { name: /^add student$/i }).first();
    await expect(addBtn).toBeEnabled({ timeout: 45000 });
    await addBtn.click();
    await expect(page.getByRole('heading', { name: /add new student/i })).toBeVisible({ timeout: 30000 });
    await page.getByLabel(/full name/i).fill(studentName);
    await page.getByLabel(/^email$/i).fill(studentEmail);
    await selectFirstRealOption(page, '#majorId');
    await selectFirstRealOption(page, '#classId');

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/api/students/students') && r.request().method() === 'POST',
      { timeout: 45000 }
    );
    await page.getByRole('button', { name: /^add student$/i }).last().click();
    const res = await createReq;
    expect(res.status(), JSON.stringify(await res.json().catch(() => ({})))).toBe(201);

    await page.getByPlaceholder(/search students/i).fill(studentName);
    await expect(page.locator('tr', { hasText: studentName }).first()).toBeVisible({ timeout: 20000 });
  });

  test('create teacher as matron', async ({ page }) => {
    await loginAsMatron(page);
    await page.goto('/school/teachers');

    if (page.url().includes('/not-authorized')) {
      throw new Error('Matron account cannot access teachers module (/school/teachers).');
    }

    await expect(page).toHaveURL(/\/school\/teachers/);
    const suffix = unique();
    const teacherName = `PW Matron Teacher ${suffix}`;
    const teacherEmail = `pw.matron.teacher.${suffix}@example.com`;

    await page.getByRole('button', { name: /^add teacher$/i }).first().click();
    await expect(page.getByText(/add new teacher/i)).toBeVisible({ timeout: 20000 });
    await page.getByLabel(/full name/i).fill(teacherName);
    await page.getByLabel(/^email/i).fill(teacherEmail);
    await page.getByLabel(/^phone/i).fill(`0788${String(suffix).slice(-6)}`);

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/api/teachers/teachers') && r.request().method() === 'POST',
      { timeout: 45000 }
    );
    await page.getByRole('button', { name: /^add teacher$/i }).last().click();
    const res = await createReq;
    expect(res.status(), JSON.stringify(await res.json().catch(() => ({})))).toBe(201);

    await page.getByPlaceholder(/search teachers/i).fill(teacherName);
    await expect(page.locator('tr', { hasText: teacherName }).first()).toBeVisible({ timeout: 20000 });
  });
});
