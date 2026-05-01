import { test, expect, type Page } from '@playwright/test';

type StaffUser = {
  id: string;
  email: string;
  role: 'school_staff';
  schoolId: string;
  name: string;
  modules: string[];
  requiresPasswordChange?: boolean;
};

function fakeJwt(): string {
  // Frontend only checks token presence in localStorage.
  return 'e2e.fake.jwt.token';
}

async function seedStaffSession(page: Page, user: StaffUser) {
  await page.addInitScript((payload) => {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
  }, { token: fakeJwt(), user });
}

test.describe('School staff module permissions', () => {
  test('students-only staff sees students module only', async ({ page }) => {
    await seedStaffSession(page, {
      id: 'staff-1',
      email: 'matron.e2e@example.com',
      role: 'school_staff',
      schoolId: 'school-1',
      name: 'Matron E2E',
      modules: ['students'],
    });

    await page.goto('/school/students');
    await expect(page).toHaveURL(/\/school\/students/);

    await expect(page.getByRole('link', { name: 'Students' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Teachers' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Courses' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'School Fees' })).toHaveCount(0);
  });

  test('students-only staff is blocked from teachers module route', async ({ page }) => {
    await seedStaffSession(page, {
      id: 'staff-2',
      email: 'matron.blocked@example.com',
      role: 'school_staff',
      schoolId: 'school-1',
      name: 'Matron Blocked',
      modules: ['students'],
    });

    await page.goto('/school/teachers');
    await expect(page).toHaveURL(/\/not-authorized/);
    await expect(page.getByRole('heading', { name: /not authorized/i })).toBeVisible();
  });

  test('dos staff with students/teachers/courses sees corresponding modules', async ({ page }) => {
    await seedStaffSession(page, {
      id: 'staff-3',
      email: 'dos.e2e@example.com',
      role: 'school_staff',
      schoolId: 'school-1',
      name: 'DOS E2E',
      modules: ['students', 'teachers', 'courses'],
    });

    await page.goto('/school/courses');
    await expect(page).toHaveURL(/\/school\/courses/);

    await expect(page.getByRole('link', { name: 'Students' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Teachers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Courses' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inquiries' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Announcements' })).toHaveCount(0);
  });
});
