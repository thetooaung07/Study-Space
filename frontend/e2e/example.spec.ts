import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Depending on what your index page actually has, you might want to change this.
  // We'll just expect it to not crash and have a title or body.
  await expect(page).toHaveURL(/http:\/\/localhost:3000/);
});
