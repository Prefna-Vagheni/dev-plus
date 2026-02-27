// e2e/user-flow.spec.ts - FINAL VERSION
import { test, expect } from '@playwright/test';

test.describe('Complete User Flow', () => {
  test('user journey from login to insights', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const signInButton = page
      .getByRole('button', { name: /continue with github/i })
      .first();
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    await signInButton.click();

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
    await expect(page).toHaveURL('/dashboard');

    await expect(page.getByText(/total commits|commits/i).first()).toBeVisible({
      timeout: 10000,
    });

    const syncButton = page.getByRole('button', { name: /sync/i }).first();
    const syncExists = await syncButton.isVisible().catch(() => false);

    if (syncExists) {
      await syncButton.click();
      await expect(page.getByText(/syncing|loading/i).first()).toBeVisible({
        timeout: 5000,
      });
    }

    await page.goto('/dashboard/insights');
    await page.waitForLoadState('networkidle');

    const generateButton = page
      .getByRole('button', { name: /generate/i })
      .first();
    const generateExists = await generateButton.isVisible().catch(() => false);

    if (generateExists) {
      await generateButton.click();

      const insightContent = page
        .locator('[data-testid="insight"]')
        .or(page.locator('[data-testid="insight-content"]'))
        .or(page.locator('.insight'))
        .first();

      await expect(insightContent).toBeVisible({ timeout: 20000 });
    }
  });
});
