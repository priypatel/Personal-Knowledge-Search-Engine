import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.txt');

test.describe('Chat', () => {
  test('query → AI response with citation pills', async ({ page }) => {
    await page.goto('/');

    // Upload sample.txt first
    await page.locator('[data-testid="file-input"]').setInputFiles(FIXTURE);
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Ready', {
      timeout: 15000,
    });

    const input = page.locator('[data-testid="message-input"]');
    await input.fill('What is Knowbase?');
    await input.press('Enter');

    // User message appears immediately
    await expect(page.locator('[data-testid="user-message"]')).toContainText('What is Knowbase?');

    // Search status appears while loading
    await expect(page.locator('[data-testid="search-status"]')).toBeVisible();

    // AI response appears (allow up to 20s for LLM)
    const aiResponse = page.locator('[data-testid="ai-response"]').first();
    await expect(aiResponse).toBeVisible({ timeout: 20000 });
    await expect(aiResponse).not.toBeEmpty();

    // At least one citation pill appears
    await expect(page.locator('[data-testid="citation-pill"]').first()).toBeVisible();
  });

  test('no match: returns no relevant data message', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('[data-testid="message-input"]');
    await input.fill('What is the boiling point of osmium on Jupiter?');
    await input.press('Enter');

    const aiResponse = page.locator('[data-testid="ai-response"]').first();
    await expect(aiResponse).toBeVisible({ timeout: 20000 });
    await expect(aiResponse).toContainText('No relevant data');
  });

  test('keyboard shortcut: / focuses input', async ({ page }) => {
    await page.goto('/');

    // Click somewhere else to ensure the input is not focused
    await page.locator('body').click();

    // Press /
    await page.keyboard.press('/');

    // The message input should be focused
    const input = page.locator('[data-testid="message-input"]');
    await expect(input).toBeFocused();
  });
});
