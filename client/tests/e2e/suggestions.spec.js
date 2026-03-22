import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.txt');

test.describe('Suggestions', () => {
  test('suggestions appear after upload and clicking populates search bar', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid="file-input"]').setInputFiles(FIXTURE);

    // Wait for document to be ready
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Ready', {
      timeout: 15000,
    });

    // At least one suggestion pill should appear
    const firstPill = page.locator('[data-testid="suggestion-pill"]').first();
    await expect(firstPill).toBeVisible({ timeout: 10000 });

    const pillText = await firstPill.textContent();

    // Click the suggestion
    await firstPill.click();

    // Message input should be populated with the suggestion text
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue(pillText.trim());
  });
});
