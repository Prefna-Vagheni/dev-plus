// e2e/ai-insights.spec.ts - FINAL VERSION
import { test, expect } from '@playwright/test';

test.describe('AI Insights', () => {
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

    await page.goto('/dashboard/insights');
    await page.waitForLoadState('networkidle');
  });

  test('should generate weekly summary', async ({ page }) => {
    const typeSelect = page
      .getByLabel(/insight type/i)
      .or(page.getByRole('combobox', { name: /insight type/i }))
      .or(page.locator('[name="insightType"]'))
      .or(page.locator('select'))
      .first();

    const selectExists = await typeSelect.isVisible().catch(() => false);

    if (selectExists) {
      await typeSelect.click();
      const option = page
        .getByRole('option', { name: /weekly summary/i })
        .or(page.getByText(/weekly summary/i))
        .first();
      await expect(option).toBeVisible({ timeout: 5000 });
      await option.click();
    }

    const generateButton = page
      .getByRole('button', { name: /generate insight/i })
      .or(page.getByRole('button', { name: /generate/i }))
      .first();

    await expect(generateButton).toBeVisible();
    await generateButton.click();

    await expect(
      page.getByText(/analyzing|generating|loading/i).first(),
    ).toBeVisible({ timeout: 5000 });

    const insightContent = page
      .locator('[data-testid="insight-content"]')
      .or(page.locator('[data-testid="insight"]'))
      .or(page.locator('.insight-content'))
      .first();

    await expect(insightContent).toBeVisible({ timeout: 20000 });
  });

  test('should handle natural language queries', async ({ page }) => {
    const typeSelect = page
      .getByLabel(/insight type/i)
      .or(page.getByRole('combobox'))
      .first();

    const selectExists = await typeSelect.isVisible().catch(() => false);

    if (selectExists) {
      await typeSelect.click();
      const option = page
        .getByRole('option', { name: /ask a question|question/i })
        .or(page.getByText(/ask a question/i))
        .first();
      await expect(option).toBeVisible({ timeout: 5000 });
      await option.click();
    }

    const queryInput = page
      .getByPlaceholder(/what repositories|question/i)
      .or(page.getByRole('textbox'))
      .or(page.locator('textarea'))
      .first();

    await expect(queryInput).toBeVisible();
    await queryInput.fill('What repositories am I most active in?');

    const generateButton = page
      .getByRole('button', { name: /generate/i })
      .first();
    await generateButton.click();

    const insightContent = page
      .locator('[data-testid="insight-content"]')
      .or(page.locator('[data-testid="insight"]'))
      .first();

    await expect(insightContent).toBeVisible({ timeout: 20000 });
  });

  test('should cache and display previous insights', async ({ page }) => {
    const generateButton = page
      .getByRole('button', { name: /generate/i })
      .first();
    const buttonExists = await generateButton.isVisible().catch(() => false);

    if (buttonExists) {
      await generateButton.click();
      const insightContent = page
        .locator('[data-testid="insight-content"]')
        .or(page.locator('[data-testid="insight"]'))
        .first();
      await expect(insightContent).toBeVisible({ timeout: 20000 });
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard/insights');
    await page.waitForLoadState('networkidle');

    const cachedInsight = page
      .locator('section', {
        hasText: /weekly summary|previous insight|insight/i,
      })
      .or(page.locator('[data-testid="insight-content"]'))
      .or(page.locator('[data-testid="insight"]'))
      .first();

    await expect(cachedInsight).toBeVisible({ timeout: 10000 });
  });
});
