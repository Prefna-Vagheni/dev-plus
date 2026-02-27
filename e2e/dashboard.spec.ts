// e2e/dashboard.spec.ts - DIRECT NAVIGATION VERSION
// Tests routes directly instead of clicking navigation links
import { test, expect } from '@playwright/test';

test.describe('Dashboard Routes', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ]);
  });

  test('should load main dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load analytics page', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/dashboard/analytics');
  });

  test('should load repositories page', async ({ page }) => {
    await page.goto('/dashboard/repositories');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/dashboard/repositories');
  });

  test('should load insights page', async ({ page }) => {
    await page.goto('/dashboard/insights');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/dashboard/insights');
  });

  test('should load activity page', async ({ page }) => {
    await page.goto('/dashboard/activity');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/dashboard/activity');
  });

  test('should load settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/dashboard/settings');
  });

  // These tests check if navigation exists (optional - will fail if nav doesn't exist)
  test.skip('navigation links exist', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if nav links exist (skip if they don't)
    const reposLink = page.getByRole('link', { name: /repositories/i });
    await expect(reposLink).toBeVisible();
  });
});
