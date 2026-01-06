import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  // Clear cookies to ensure a logged-out state for each test run.
  await context.clearCookies();
});

test('should allow a user to log in and see the dashboard', async ({ page }) => {
  // 1. Navigate to the landing page.
  await page.goto('http://localhost:5175/');

  // 2. Click the "Get started" button to go to the authentication page.
  await page.getByRole('button', { name: 'Get started' }).click();

  // 3. Verify that the page defaults to the Sign In view.
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({ timeout: 15000 });

  // 4. Fill in the user credentials using placeholder text for more reliable selection.
  await page.getByPlaceholder('name@example.com').fill('testuser@example.com');
  await page.getByPlaceholder('••••••••').fill('password');

  // 5. Click the "Sign In" button.
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // 6. After successful login, verify the user is on the dashboard.
  await expect(page.getByRole('heading', { name: 'Your Dashboard' })).toBeVisible({ timeout: 15000 });
});
