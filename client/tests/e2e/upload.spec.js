import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.txt');

test.describe('Upload flow', () => {
  test('txt file → status transitions → appears in sidebar', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(FIXTURE);

    // Status transitions to uploading/processing
    const statusIndicator = page.locator('[data-testid="status-indicator"]');
    await expect(statusIndicator).toBeVisible();

    // Eventually reaches "Ready"
    await expect(statusIndicator).toContainText('Ready', { timeout: 15000 });

    // Sidebar should list the document
    await expect(page.locator('[data-testid="document-list-item"]')).toContainText(
      'sample.txt',
      { timeout: 5000 }
    );

    // TXT badge should be visible
    await expect(page.locator('[data-testid="file-badge"]').first()).toContainText('TXT');
  });

  test('upload error: unsupported file type', async ({ page }) => {
    await page.goto('/');

    // Create and upload a fake .exe file
    await page.locator('[data-testid="file-input"]').setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('fake binary'),
    });

    await expect(page.locator('[data-testid="status-indicator"]')).toContainText(
      'not supported',
      { timeout: 5000 }
    );
  });

  test('upload error: file too large', async ({ page }) => {
    await page.goto('/');

    // Create a buffer larger than 10 MB
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
    await page.locator('[data-testid="file-input"]').setInputFiles({
      name: 'huge.txt',
      mimeType: 'text/plain',
      buffer: bigBuffer,
    });

    await expect(page.locator('[data-testid="status-indicator"]')).toContainText(
      '10MB',
      { timeout: 5000 }
    );
  });
});
