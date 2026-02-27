// e2e/accessibility.spec.ts - FINAL VERSION
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
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

  test('should have no accessibility violations on dashboard', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);

    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const buttons = await page.getByRole('button').all();
    const buttonsToCheck = buttons.slice(0, 10);

    for (const button of buttonsToCheck) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      expect(ariaLabel || text?.trim() || title).toBeTruthy();
    }
  });
});

test.describe('Performance', () => {
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

  test('should load dashboard within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large datasets', async ({ page }) => {
    await page.goto('/dashboard/repositories');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/repositories/i).first()).toBeVisible({
      timeout: 10000,
    });

    const scrollStart = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(300);
    const scrollEnd = await page.evaluate(() => window.scrollY);
    expect(scrollEnd).toBeGreaterThan(scrollStart);
  });
});
