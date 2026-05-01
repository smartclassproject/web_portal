import { test, expect, type Page } from '@playwright/test';

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

type MockStaff = {
  _id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  staffRole: string;
  customRoleTitle?: string;
  modules: string[];
  isActive: boolean;
  passwordSetup?: boolean;
  lastCredentialsSentAt?: string | null;
  createdAt: string;
};

async function seedSchoolAdminSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e.fake.jwt');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'school-admin-1',
        email: 'school.admin@example.com',
        role: 'school_admin',
        schoolId: 'school-1',
        name: 'School Admin',
      })
    );
  });
}

async function installStaffApiMocks(page: Page, options?: { resendErrorMessage?: string }) {
  const staffStore: MockStaff[] = [
    {
      _id: 'staff-seed-1',
      schoolId: 'school-1',
      firstName: 'Seed',
      lastName: 'Matron',
      email: 'seed.matron@example.com',
      phoneNumber: '0780000001',
      staffRole: 'MATRON',
      modules: ['students'],
      isActive: true,
      passwordSetup: false,
      lastCredentialsSentAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'staff-seed-2',
      schoolId: 'school-1',
      firstName: 'Seed',
      lastName: 'DOS',
      email: 'seed.dos@example.com',
      phoneNumber: '0780000002',
      staffRole: 'DIRECTOR_OF_STUDIES',
      modules: ['students', 'teachers', 'courses'],
      isActive: true,
      passwordSetup: true,
      lastCredentialsSentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const modules = [
    { _id: 'm1', key: 'students', label: 'Students', isActive: true },
    { _id: 'm2', key: 'teachers', label: 'Teachers', isActive: true },
    { _id: 'm3', key: 'courses', label: 'Courses', isActive: true },
    { _id: 'm4', key: 'finance', label: 'Finance', isActive: true },
  ];

  const templates = {
    templates: [
      { role: 'MATRON', defaultModules: ['students'] },
      { role: 'DIRECTOR_OF_STUDIES', defaultModules: ['students', 'teachers', 'courses'] },
    ],
  };

  await page.route('**/api/staff/roles/templates', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: templates }) });
  });

  await page.route('**/api/staff/modules', async (route) => {
    const req = route.request();
    if (req.method() !== 'GET') return route.fallback();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: modules }) });
  });

  await page.route('**/api/staff', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: staffStore }),
      });
    }

    if (method === 'POST') {
      const payload = (await req.postDataJSON()) as Partial<MockStaff>;
      const created: MockStaff = {
        _id: `staff-${Date.now()}`,
        schoolId: 'school-1',
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        email: payload.email || '',
        phoneNumber: payload.phoneNumber || '',
        staffRole: payload.staffRole || 'MATRON',
        customRoleTitle: payload.customRoleTitle,
        modules: payload.modules || ['students'],
        isActive: true,
        passwordSetup: false,
        lastCredentialsSentAt: null,
        createdAt: new Date().toISOString(),
      };
      staffStore.unshift(created);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: created }),
      });
    }

    return route.fallback();
  });

  await page.route('**/api/staff/*/status', async (route) => {
    const req = route.request();
    if (req.method() !== 'PUT') return route.fallback();
    const id = req.url().split('/').slice(-2)[0];
    const payload = (await req.postDataJSON()) as { isActive: boolean };
    const found = staffStore.find((s) => s._id === id);
    if (found && !found.passwordSetup) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Cannot deactivate or activate staff before password setup is completed',
        }),
      });
    }
    if (found) found.isActive = payload.isActive;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: found }),
    });
  });

  await page.route('**/api/staff/*', async (route) => {
    const req = route.request();
    if (req.method() !== 'DELETE') return route.fallback();
    const id = req.url().split('/').pop() as string;
    const index = staffStore.findIndex((s) => s._id === id);
    if (index === -1) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Staff not found' }),
      });
    }
    if (staffStore[index].passwordSetup) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Cannot delete staff after password setup is completed; use deactivate',
        }),
      });
    }
    staffStore.splice(index, 1);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Staff deleted successfully' }),
    });
  });

  await page.route('**/api/staff/*/reset-credentials', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Staff credentials reset successfully' }),
    });
  });

  await page.route('**/api/staff/*/resend-credentials', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    if (options?.resendErrorMessage) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: options.resendErrorMessage }),
      });
    }
    const id = req.url().split('/').slice(-2)[0];
    const found = staffStore.find((s) => s._id === id);
    if (found) {
      found.lastCredentialsSentAt = new Date().toISOString();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Login credentials email has been resent successfully!',
        data: {
          staffId: id,
          email: found?.email || 'unknown@example.com',
          passwordSetup: found?.passwordSetup ?? false,
          lastCredentialsSentAt: found?.lastCredentialsSentAt || null,
        },
      }),
    });
  });

  await page.route('**/api/staff/*', async (route) => {
    const req = route.request();
    if (req.method() !== 'PUT') return route.fallback();
    const id = req.url().split('/').pop() as string;
    const payload = (await req.postDataJSON()) as Partial<MockStaff>;
    const found = staffStore.find((s) => s._id === id);
    if (found) {
      Object.assign(found, payload);
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: found }),
    });
  });
}

async function goToStaffPage(page: Page) {
  await page.goto('/school/staff');
  await expect(page.getByRole('heading', { name: /staff management/i })).toBeVisible({ timeout: 20_000 });
}

test.describe('School staff management', () => {
  test.setTimeout(120_000);

  test('loads staff management page', async ({ page }) => {
    await seedSchoolAdminSession(page);
    await installStaffApiMocks(page);
    await goToStaffPage(page);
    await expect(page.getByRole('button', { name: /add staff/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search staff/i)).toBeVisible();
  });

  test('create, edit, delete pending setup, and reset staff credentials', async ({ page }) => {
    await seedSchoolAdminSession(page);
    await installStaffApiMocks(page);
    await goToStaffPage(page);

    const suffix = uniqueSuffix();
    const createdEmail = `staff.e2e.${suffix}@example.com`;
    const updatedEmail = `staff.e2e.updated.${suffix}@example.com`;
    const firstName = `E2E${suffix}`;
    const lastName = 'Staff';

    await page.getByRole('button', { name: /add staff/i }).click();
    await expect(page.getByRole('heading', { name: /^add staff$/i })).toBeVisible();

    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(createdEmail);
    await page.getByLabel('Phone Number').fill(`078${suffix.slice(-7)}`);
    await page.getByLabel('Role').selectOption('MATRON');

    // Ensure at least one module selected (role defaults should handle this, fallback for safety).
    const checkedModules = page.locator('input[type="checkbox"]:checked');
    if ((await checkedModules.count()) === 0) {
      await page.locator('input[type="checkbox"]').first().check();
    }

    await page.getByRole('button', { name: /create staff/i }).click();

    const createdRow = page.locator('tr', { hasText: createdEmail }).first();
    await expect(createdRow).toBeVisible({ timeout: 15_000 });

    await createdRow.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('heading', { name: /edit staff/i })).toBeVisible();
    await page.getByLabel('Email').fill(updatedEmail);
    await page.getByLabel('Role').selectOption('DIRECTOR_OF_STUDIES');

    await page.getByRole('button', { name: /save changes/i }).click();

    const updatedRow = page.locator('tr', { hasText: updatedEmail }).first();
    await expect(updatedRow).toBeVisible({ timeout: 15_000 });
    await expect(updatedRow).toContainText(/DIRECTOR OF STUDIES/i);

    await expect(updatedRow.getByRole('button', { name: /delete/i })).toBeVisible();
    await expect(updatedRow.getByRole('button', { name: /deactivate/i })).toHaveCount(0);

    await updatedRow.getByRole('button', { name: /reset credentials/i }).click();
    await expect(page.getByRole('heading', { name: /reset credentials/i })).toBeVisible();
    await page.getByLabel('New Password').fill(`Temp${suffix}`);

    await page.getByRole('button', { name: /^reset$/i }).click();
    await expect(page.getByRole('heading', { name: /reset credentials/i })).toHaveCount(0);

    await updatedRow.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('heading', { name: /delete staff/i })).toBeVisible();
    await page.getByRole('button', { name: /delete staff/i }).click();
    await expect(page.locator('tr', { hasText: updatedEmail })).toHaveCount(0);
  });

  test('completed setup staff supports deactivate and activate only', async ({ page }) => {
    await seedSchoolAdminSession(page);
    await installStaffApiMocks(page);
    await goToStaffPage(page);

    const completedRow = page.locator('tr', { hasText: 'seed.dos@example.com' }).first();
    await expect(completedRow.getByRole('button', { name: /deactivate/i })).toBeVisible();
    await expect(completedRow.getByRole('button', { name: /delete/i })).toHaveCount(0);

    await completedRow.getByRole('button', { name: /deactivate/i }).click();
    await expect(completedRow).toContainText(/inactive/i);

    await completedRow.getByRole('button', { name: /activate/i }).click();
    await expect(completedRow).toContainText(/active/i);
  });

  test('shows password setup filter and resend credentials action', async ({ page }) => {
    await seedSchoolAdminSession(page);
    await installStaffApiMocks(page);
    await goToStaffPage(page);

    await expect(page.getByRole('combobox', { name: /password setup filter/i })).toBeVisible();

    const seedRow = page.locator('tr', { hasText: 'seed.matron@example.com' }).first();
    await expect(seedRow.getByText(/^Pending$/)).toBeVisible();
    const resendSuccess = page.waitForResponse(
      (response) =>
        response.url().includes('/api/staff/staff-seed-1/resend-credentials') && response.status() === 200
    );
    await seedRow.getByRole('button', { name: /resend credentials/i }).click();
    await resendSuccess;
  });

  test('resend credentials surfaces API errors', async ({ page }) => {
    await seedSchoolAdminSession(page);
    await installStaffApiMocks(page, { resendErrorMessage: 'SMTP timeout' });
    await goToStaffPage(page);

    const seedRow = page.locator('tr', { hasText: 'seed.matron@example.com' }).first();
    const resendFailure = page.waitForResponse(
      (response) =>
        response.url().includes('/api/staff/staff-seed-1/resend-credentials') && response.status() === 500
    );
    await seedRow.getByRole('button', { name: /resend credentials/i }).click();
    await resendFailure;
  });
});
