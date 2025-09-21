import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage visual regression', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the entire page
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('color palette visual regression', async ({ page }) => {
    // Generate a consistent palette for testing
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('consistent test palette with blue and orange');
    await generateButton.click();
    
    // Wait for palette to load
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Allow animations to complete
    
    // Screenshot just the palette area
    const palette = page.locator('[data-testid="color-palette"]');
    await expect(palette).toHaveScreenshot('color-palette.png', {
      threshold: 0.3, // Allow for slight color variations
    });
  });

  test('accessibility panel visual regression', async ({ page }) => {
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('accessibility test colors');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Screenshot accessibility panel
    const accessibilityPanel = page.locator('[data-testid="accessibility-panel"]');
    await expect(accessibilityPanel).toHaveScreenshot('accessibility-panel.png', {
      threshold: 0.2,
    });
  });

  test('mobile responsive visual regression', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('mobile test colors');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('color accuracy validation', async ({ page }) => {
    // Generate a palette with known colors
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('pure red, pure blue, pure green colors');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Get color values and validate they're reasonable
    const colorItems = page.locator('[data-testid="color-item"]');
    const count = await colorItems.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const colorItem = colorItems.nth(i);
      const hexValue = await colorItem.locator('[data-testid="color-hex"]').textContent();
      
      // Validate hex format
      expect(hexValue).toMatch(/^#[0-9A-Fa-f]{6}$/);
      
      // Take screenshot of individual color for visual validation
      await expect(colorItem).toHaveScreenshot(`color-${i}.png`, {
        threshold: 0.1,
      });
    }
  });

  test('color blindness simulation visual regression', async ({ page }) => {
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('colorblind test palette');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Enable color blindness simulation
    const colorBlindToggle = page.locator('[data-testid="colorblind-toggle"]');
    if (await colorBlindToggle.isVisible()) {
      await colorBlindToggle.click();
      await page.waitForTimeout(500);
      
      // Screenshot with color blindness simulation
      const palette = page.locator('[data-testid="color-palette"]');
      await expect(palette).toHaveScreenshot('colorblind-simulation.png', {
        threshold: 0.3,
      });
    }
  });

  test('export dropdown visual regression', async ({ page }) => {
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('export visual test');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Open export dropdown
    const exportButton = page.locator('[data-testid="export-button"]');
    await exportButton.click();
    
    // Screenshot dropdown
    const exportDropdown = page.locator('[data-testid="export-dropdown"]');
    await expect(exportDropdown).toHaveScreenshot('export-dropdown.png', {
      threshold: 0.2,
    });
  });
});