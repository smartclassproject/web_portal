import { test, expect, type Page, type Locator } from '@playwright/test';

const SCHOOL_EMAIL = process.env.SCHOOL_ADMIN_EMAIL;
const SCHOOL_PASSWORD = process.env.SCHOOL_ADMIN_PASSWORD;

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function loginAsSchoolAdmin(page: Page) {
  test.skip(!SCHOOL_EMAIL || !SCHOOL_PASSWORD, 'SCHOOL_ADMIN_EMAIL and SCHOOL_ADMIN_PASSWORD are required');
  let lastError = 'Login did not reach school portal.';
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(SCHOOL_EMAIL!);
    await page.getByLabel(/password/i).fill(SCHOOL_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();

    try {
      await page.waitForURL(/\/school(\/|$)/, { timeout: 20_000 });
      return;
    } catch {
      const networkError = page.getByText(/network error/i);
      if (await networkError.isVisible().catch(() => false)) {
        lastError = 'Login failed with network error from API.';
      }
      if (attempt < 3) {
        await page.waitForTimeout(1000 * attempt);
      }
    }
  }
  throw new Error(lastError);
}

async function openStudentsPage(page: Page) {
  await page.goto('/school/students');
  await expect(page.getByRole('heading', { name: 'Students', exact: true })).toBeVisible({
    timeout: 20_000,
  });
}

async function openAddStudentModal(page: Page) {
  const modalHeading = page.getByText('Add New Student').first();
  if (await modalHeading.isVisible().catch(() => false)) return;

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (await modalHeading.isVisible().catch(() => false)) return;
    const addButton = page.getByRole('button', { name: /^add student$/i }).first();
    await expect(addButton).toBeEnabled({ timeout: 30_000 });
    await addButton.click({ timeout: 5_000 }).catch(() => {});
    if (await modalHeading.isVisible().catch(() => false)) return;
    if (attempt < 3) await page.waitForTimeout(1000 * attempt);
  }
  throw new Error('Unable to open Add Student modal (school settings may have failed to load).');
}

async function selectFirstRealOption(select: Locator) {
  const firstRealValue = await select
    .locator('option')
    .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value).find((value) => value && value.trim().length > 0) || '');
  expect(firstRealValue).not.toBe('');
  await select.selectOption(firstRealValue);
}

async function fillStudentForm(page: Page, name: string, email?: string) {
  await page.getByLabel(/full name/i).fill(name);
  if (email) {
    await page.getByLabel(/^email$/i).fill(email);
  }
  await selectFirstRealOption(page.locator('#majorId'));
  await selectFirstRealOption(page.locator('#classId'));
}

async function deleteStudentByName(page: Page, studentName: string) {
  await page.getByPlaceholder(/search students/i).fill(studentName);
  const row = page.locator('tr', { hasText: studentName }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.getByRole('button', { name: /^delete$/i }).click();
  await page.getByRole('button', { name: /^delete$/i }).last().click();
  await expect(page.getByText(/student deleted successfully/i)).toBeVisible({ timeout: 10_000 });
}

test.describe('School Admin students', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await openStudentsPage(page);
  });

  test('loads students list page', async ({ page }) => {
    await expect(page.getByPlaceholder(/search students/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add student/i }).first()).toBeVisible();
  });

  test('shows validation for required student fields', async ({ page }) => {
    await openAddStudentModal(page);
    await page.getByRole('button', { name: /^add student$/i }).last().click();
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Major is required')).toBeVisible();
    await expect(page.getByText('Class is required')).toBeVisible();
  });

  test('creates a student and can find/delete it', async ({ page }) => {
    const suffix = uniqueSuffix();
    const studentName = `E2E Student ${suffix}`;
    const studentEmail = `e2e.student.${suffix}@example.com`;

    await openAddStudentModal(page);
    await fillStudentForm(page, studentName, studentEmail);
    const createRequest = page.waitForResponse(
      (response) =>
        response.url().includes('/api/students/students') &&
        response.request().method() === 'POST',
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: /^add student$/i }).last().click();
    const response = await createRequest;
    const responseBody = await response.json().catch(() => ({}));
    expect(response.status(), JSON.stringify(responseBody)).toBe(201);

    await page.getByPlaceholder(/search students/i).fill(studentName);
    await expect(page.locator('tr', { hasText: studentName }).first()).toBeVisible({ timeout: 15_000 });

    await deleteStudentByName(page, studentName);
  });
});
