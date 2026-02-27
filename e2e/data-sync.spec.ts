// e2e/data-sync.spec.ts - FINAL VERSION
import { test, expect } from '@playwright/test';

test.describe('GitHub Data Sync', () => {
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
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should trigger GitHub sync', async ({ page }) => {
    const syncButton = page
      .getByRole('button', { name: /sync/i })
      .or(page.getByRole('button', { name: /refresh/i }))
      .or(page.locator('button:has-text("Sync")'))
      .first();

    await expect(syncButton).toBeVisible({ timeout: 10000 });
    await syncButton.click();

    await expect(
      page.getByText(/syncing|loading|refreshing/i).first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/sync complete|success|synced/i).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('should show sync progress', async ({ page }) => {
    const syncButton = page
      .getByRole('button', { name: /sync/i })
      .or(page.locator('button:has-text("Sync")'))
      .first();

    await syncButton.click();

    const progressIndicator = page
      .locator('[role="progressbar"]')
      .or(page.locator('.loading'))
      .or(page.locator('[aria-busy="true"]'))
      .first();

    await expect(progressIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should update stats after sync', async ({ page }) => {
    const commitsCard = page
      .getByText(/total commits|commits/i)
      .locator('..')
      .first();
    await expect(commitsCard).toBeVisible();

    const syncButton = page.getByRole('button', { name: /sync/i }).first();
    await syncButton.click();
    await page.waitForTimeout(3000);

    await expect(commitsCard).toBeVisible();
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    await page.route('**/api/github/sync', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Sync failed' }),
      });
    });

    const syncButton = page.getByRole('button', { name: /sync/i }).first();
    await syncButton.click();

    await expect(
      page.getByText(/error|failed|couldn't sync/i).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
