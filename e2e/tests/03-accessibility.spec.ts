import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('color palette should be accessible', async ({ page }) => {
    // Generate a palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('accessible color test');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Run accessibility scan on the palette
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="color-palette"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation should work', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Should focus on prompt input
    const promptInput = page.locator('[data-testid="prompt-input"]');
    await expect(promptInput).toBeFocused();
    
    // Type and submit with Enter
    await promptInput.fill('keyboard test colors');
    await page.keyboard.press('Enter');
    
    // Wait for palette
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Tab to first color
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate color with Enter or Space
    await page.keyboard.press('Enter');
    
    // Should show copy confirmation
    await expect(page.locator('[data-testid="toast"]')).toContainText('copied', { timeout: 3000 });
  });

  test('screen reader compatibility', async ({ page }) => {
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('screen reader test');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Check for proper ARIA labels
    const colorItems = page.locator('[data-testid="color-item"]');
    const firstColor = colorItems.first();
    
    // Should have accessible name
    const ariaLabel = await firstColor.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('#'); // Should contain hex value
    
    // Check for role attributes
    const role = await firstColor.getAttribute('role');
    expect(role).toBe('button');
    
    // Check accessibility panel has proper headings
    const accessibilityPanel = page.locator('[data-testid="accessibility-panel"]');
    const headings = accessibilityPanel.locator('h2, h3, h4');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('color contrast compliance', async ({ page }) => {
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('high contrast accessible colors');
    await generateButton.click();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Check that accessibility panel shows contrast ratios
    const accessibilityPanel = page.locator('[data-testid="accessibility-panel"]');
    const contrastRatios = accessibilityPanel.locator('[data-testid="contrast-ratio"]');
    
    const ratioCount = await contrastRatios.count();
    expect(ratioCount).toBeGreaterThan(0);
    
    // Check that at least some combinations pass WCAG AA
    const passingRatios = accessibilityPanel.locator('[data-testid="contrast-pass"]');
    const passingCount = await passingRatios.count();
    expect(passingCount).toBeGreaterThan(0);
  });

  test('focus management', async ({ page }) => {
    // Test focus trap in modals/dropdowns
    const promptInput = page.locator('[data-testid="prompt-input"]');
    await promptInput.fill('focus test');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Open export dropdown
    const exportButton = page.locator('[data-testid="export-button"]');
    await exportButton.click();
    
    // Focus should be managed within dropdown
    const exportDropdown = page.locator('[data-testid="export-dropdown"]');
    await expect(exportDropdown).toBeVisible();
    
    // Tab through options
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    
    // Should be within the dropdown
    const isWithinDropdown = await exportDropdown.locator(':focus').count() > 0;
    expect(isWithinDropdown).toBe(true);
    
    // Escape should close dropdown
    await page.keyboard.press('Escape');
    await expect(exportDropdown).not.toBeVisible();
  });

  test('reduced motion support', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('reduced motion test');
    await generateButton.click();
    
    // Palette should still appear but without animations
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Run accessibility scan with reduced motion
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('high contrast mode support', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('high contrast mode test');
    await generateButton.click();
    
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Check that interface is still usable
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('zoom support up to 200%', async ({ page }) => {
    // Set zoom to 200%
    await page.setViewportSize({ width: 640, height: 480 }); // Simulate 200% zoom
    
    // Generate palette
    const promptInput = page.locator('[data-testid="prompt-input"]');
    const generateButton = page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill('zoom test colors');
    await generateButton.click();
    
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 10000 });
    
    // Interface should still be functional
    const colorItems = page.locator('[data-testid="color-item"]');
    const firstColor = colorItems.first();
    await firstColor.click();
    
    // Should still be able to copy colors
    await expect(page.locator('[data-testid="toast"]')).toContainText('copied', { timeout: 3000 });
  });
});