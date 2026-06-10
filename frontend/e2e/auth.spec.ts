import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

  test('should display login page and perform a successful login simulation', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/auth/login');

    // Check that the page loaded correctly
    await expect(page.locator('h1')).toContainText('StudySpace');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Fill in the login form
    await page.getByLabel('Email / Username').fill('student@studyspace.com');
    await page.getByLabel('Password').fill('password123');

    // Route network requests so the test doesn't actually hit the backend
    await page.route('**/api/auth/login', async route => {
      const json = { token: 'fake-jwt', user: { id: 1, role: 'STUDENT' } };
      await route.fulfill({ json });
    });

    // We also intercept the dashboard redirect check
    await page.route('**/api/users/me', async route => {
      const json = { id: 1, role: 'STUDENT', username: 'student' };
      await route.fulfill({ json });
    });

    // Intercept courses fetch which might happen after login redirect
    await page.route('**/api/courses/my-enrollments*', async route => {
      await route.fulfill({ json: { content: [], totalElements: 0 } });
    });

    // Click submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // It should redirect to dashboard/home after login, meaning URL changes from /auth/login
    // We wait for the URL to change. 
    // We wait for the URL to change away from the login page.
    await page.waitForURL((url) => !url.href.includes('/auth/login'));
    expect(page.url()).not.toContain('/auth/login');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel('Email / Username').fill('wrong@studyspace.com');
    await page.getByLabel('Password').fill('wrongpassword');

    await page.route('**/api/auth/login', async route => {
      await route.fulfill({ 
        status: 401, 
        json: { message: 'Invalid Credentials!' } 
      });
    });

    await page.getByRole('button', { name: /sign in/i }).click();

    // Error message should appear
    await expect(page.getByText('Invalid Credentials!')).toBeVisible();
  });
});
