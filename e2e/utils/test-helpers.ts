import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Generate a test palette and wait for it to load
   */
  async generateTestPalette(prompt: string = 'test colors for automation') {
    const promptInput = this.page.locator('[data-testid="prompt-input"]');
    const generateButton = this.page.locator('[data-testid="generate-button"]');
    
    await promptInput.fill(prompt);
    await generateButton.click();
    
    // Wait for palette to be generated
    await expect(this.page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 15000 });
    
    return this.page.locator('[data-testid="color-palette"]');
  }

  /**
   * Upload a test image and wait for processing
   */
  async uploadTestImage(imagePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(imagePath);
    
    // Wait for processing to complete
    await expect(this.page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 20000 });
    
    return this.page.locator('[data-testid="color-palette"]');
  }

  /**
   * Wait for loading states to complete
   */
  async waitForLoadingComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"], [data-testid*="spinner"]');
      return loadingElements.length === 0;
    }, { timeout: 10000 });
  }

  /**
   * Check if colors are valid hex values
   */
  async validateColorHexValues() {
    const colorItems = this.page.locator('[data-testid="color-item"]');
    const count = await colorItems.count();
    
    for (let i = 0; i < count; i++) {
      const hexValue = await colorItems.nth(i).locator('[data-testid="color-hex"]').textContent();
      expect(hexValue).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
    
    return count;
  }

  /**
   * Test export functionality for a specific format
   */
  async testExport(format: string) {
    const exportButton = this.page.locator('[data-testid="export-button"]');
    await exportButton.click();
    
    const exportOption = this.page.locator(`[data-testid="export-${format}"]`);
    
    // Start waiting for download before clicking
    const downloadPromise = this.page.waitForEvent('download');
    await exportOption.click();
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain(`.${format}`);
    
    return download;
  }

  /**
   * Check accessibility compliance indicators
   */
  async checkAccessibilityIndicators() {
    const accessibilityPanel = this.page.locator('[data-testid="accessibility-panel"]');
    await expect(accessibilityPanel).toBeVisible();
    
    // Check for WCAG score
    const wcagScore = accessibilityPanel.locator('[data-testid="wcag-score"]');
    await expect(wcagScore).toBeVisible();
    
    const scoreText = await wcagScore.textContent();
    expect(scoreText).toMatch(/AA|AAA|FAIL/);
    
    return scoreText;
  }

  /**
   * Simulate mobile viewport
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Simulate tablet viewport
   */
  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  /**
   * Simulate desktop viewport
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Check for error messages
   */
  async checkForErrors() {
    const errorMessages = this.page.locator('[data-testid="error-message"], [role="alert"]');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      const errorTexts = await errorMessages.allTextContents();
      console.warn('Errors found:', errorTexts);
    }
    
    return errorCount;
  }

  /**
   * Wait for toast notifications
   */
  async waitForToast(expectedText?: string) {
    const toast = this.page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    if (expectedText) {
      await expect(toast).toContainText(expectedText);
    }
    
    return toast;
  }

  /**
   * Clear all form inputs
   */
  async clearAllInputs() {
    const inputs = this.page.locator('input, textarea');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).clear();
    }
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Check network requests for errors
   */
  async monitorNetworkErrors() {
    const errors: string[] = [];
    
    this.page.on('response', response => {
      if (response.status() >= 400) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    this.page.on('requestfailed', request => {
      errors.push(`Failed: ${request.url()}`);
    });
    
    return errors;
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork() {
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1000 * 1024 / 8, // 1 Mbps
      uploadThroughput: 500 * 1024 / 8,     // 500 Kbps
      latency: 100, // 100ms
    });
  }

  /**
   * Reset network conditions
   */
  async resetNetworkConditions() {
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  }
}