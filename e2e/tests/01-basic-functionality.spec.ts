import { test, expect } from '@playwright/test';

test.describe('Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/ChromaGen/);
    await expect(page.locator('h1')).toContainText('ChromaGen');
  });

  test('should display prompt input component', async ({ page }) => {
    const promptInput = page.locator('[data-testid="prompt-input"]');
    await expect(promptInput).toBeVisible();
    await expect(promptInput).toHaveAttribute('placeholder');
  });

  test('should display image upload component', async ({ page }) => {
    const imageUpload = page.locator('[data-testid="image-upload"]');
    await expect(imageUpload).toBeVisible();
  });

  test('should generate palette from text prompt', async ({ page }) => {
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('vibrant sunset colors for a beach resort');
    await generateButton.click();
    
    // Wait for palette to be generated
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Check that colors are displayed
    const colors = page.locator('[data-testid="color-item"]');
    await expect(colors).toHaveCount.greaterThan(3);
    
    // Check that each color has hex value
    const firstColor = colors.first();
    await expect(firstColor.locator('[data-testid="color-hex"]')).toContainText('#');
  });

  test('should copy color to clipboard', async ({ page }) => {
    // First generate a palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('test colors');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Click on first color to copy
    const firstColor = page.locator('[data-testid="color-item"]').first();
    await firstColor.click();
    
    // Check for success message
    await expect(page.locator('[data-testid="toast"]')).toContainText('copied', { timeout: 3000 });
  });

  test('should show accessibility panel', async ({ page }) => {
    // Generate a palette first
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('accessible color scheme');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Check accessibility panel
    const accessibilityPanel = page.locator('[data-testid="accessibility-panel"]');
    await expect(accessibilityPanel).toBeVisible();
    
    // Check for WCAG compliance indicators
    await expect(accessibilityPanel.locator('[data-testid="wcag-score"]')).toBeVisible();
  });

  test('should export palette', async ({ page }) => {
    // Generate a palette first
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('export test colors');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Open export dropdown
    const exportButton = page.locator('[data-testid="export-button"]');
    await exportButton.click();
    
    // Check export options
    const exportDropdown = page.locator('[data-testid="export-dropdown"]');
    await expect(exportDropdown).toBeVisible();
    
    // Test CSS export
    const cssExport = page.locator('[data-testid="export-css"]');
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await cssExport.click();
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.css');
  });
});