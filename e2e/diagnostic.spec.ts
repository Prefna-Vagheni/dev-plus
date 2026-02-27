// e2e/diagnostic.spec.ts - Alternative cookie approach
import { test, expect } from '@playwright/test';

test.describe('DOM Diagnostic Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Try setting cookies AFTER navigating to the page
    await page.goto('/');

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

  test('diagnose dashboard structure', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('=== PAGE TITLE ===');
    console.log(await page.title());

    console.log('\n=== ALL LINKS ===');
    const links = await page.getByRole('link').all();
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`Link: "${text}" -> ${href}`);
    }

    console.log('\n=== ALL BUTTONS ===');
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      console.log(`Button: text="${text?.trim()}", aria-label="${ariaLabel}"`);
    }

    expect(true).toBe(true);
  });

  test('diagnose insights page', async ({ page }) => {
    await page.goto('/dashboard/insights');
    await page.waitForLoadState('networkidle');

    console.log('\n=== INSIGHTS PAGE ===');
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    console.log('\n=== BUTTONS ===');
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      console.log(`Button: "${text?.trim()}"`);
    }

    expect(true).toBe(true);
  });

  test('diagnose auth cookie', async ({ page, context }) => {
    const cookies = await context.cookies();
    console.log('\n=== COOKIES ===');
    console.log(JSON.stringify(cookies, null, 2));

    await page.goto('/dashboard');
    console.log('\n=== URL ===');
    console.log('Final URL:', page.url());

    expect(true).toBe(true);
  });
});
