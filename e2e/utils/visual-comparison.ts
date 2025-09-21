import { Page } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

export class VisualComparison {
  private baselineDir: string;
  private actualDir: string;
  private diffDir: string;

  constructor() {
    this.baselineDir = path.join(__dirname, '../visual-baselines');
    this.actualDir = path.join(__dirname, '../visual-actual');
    this.diffDir = path.join(__dirname, '../visual-diffs');
    
    // Ensure directories exist
    [this.baselineDir, this.actualDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Compare color accuracy between expected and actual colors
   */
  async compareColorAccuracy(
    page: Page,
    expectedColors: string[],
    tolerance: number = 10
  ): Promise<{ passed: boolean; differences: Array<{ expected: string; actual: string; difference: number }> }> {
    const colorItems = page.locator('[data-testid="color-item"]');
    const count = await colorItems.count();
    const differences: Array<{ expected: string; actual: string; difference: number }> = [];
    
    for (let i = 0; i < Math.min(count, expectedColors.length); i++) {
      const actualHex = await colorItems.nth(i).locator('[data-testid="color-hex"]').textContent();
      const expectedHex = expectedColors[i];
      
      if (actualHex && expectedHex) {
        const difference = this.calculateColorDifference(expectedHex, actualHex);
        differences.push({
          expected: expectedHex,
          actual: actualHex,
          difference
        });
      }
    }
    
    const passed = differences.every(diff => diff.difference <= tolerance);
    
    return { passed, differences };
  }

  /**
   * Calculate color difference using Delta E formula
   */
  private calculateColorDifference(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 100; // Max difference if invalid colors
    
    // Simple RGB distance (could be improved with Lab color space)
    const rDiff = rgb1.r - rgb2.r;
    const gDiff = rgb1.g - rgb2.g;
    const bDiff = rgb1.b - rgb2.b;
    
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Compare screenshots with pixel-level accuracy
   */
  async compareScreenshots(
    actualPath: string,
    baselinePath: string,
    threshold: number = 0.1
  ): Promise<{ passed: boolean; diffPixels: number; totalPixels: number; diffPath?: string }> {
    if (!fs.existsSync(baselinePath)) {
      // If no baseline exists, copy actual as baseline
      fs.copyFileSync(actualPath, baselinePath);
      return { passed: true, diffPixels: 0, totalPixels: 0 };
    }

    const actualImg = PNG.sync.read(fs.readFileSync(actualPath));
    const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
    
    const { width, height } = actualImg;
    const diff = new PNG({ width, height });
    
    const diffPixels = pixelmatch(
      actualImg.data,
      baselineImg.data,
      diff.data,
      width,
      height,
      { threshold }
    );
    
    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;
    const passed = diffPercentage < 1; // Allow 1% difference
    
    let diffPath: string | undefined;
    if (!passed) {
      diffPath = path.join(this.diffDir, path.basename(actualPath));
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }
    
    return { passed, diffPixels, totalPixels, diffPath };
  }

  /**
   * Validate color contrast ratios
   */
  validateContrastRatio(foreground: string, background: string): { ratio: number; wcagAA: boolean; wcagAAA: boolean } {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    };
  }

  /**
   * Calculate relative luminance of a color
   */
  private getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Generate visual regression report
   */
  generateReport(results: Array<{
    testName: string;
    passed: boolean;
    diffPixels?: number;
    totalPixels?: number;
    diffPath?: string;
  }>): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    let report = `# Visual Regression Test Report\n\n`;
    report += `**Summary:** ${passedTests}/${totalTests} tests passed\n\n`;
    
    if (failedTests > 0) {
      report += `## Failed Tests (${failedTests})\n\n`;
      
      results.filter(r => !r.passed).forEach(result => {
        report += `### ${result.testName}\n`;
        if (result.diffPixels && result.totalPixels) {
          const percentage = ((result.diffPixels / result.totalPixels) * 100).toFixed(2);
          report += `- **Difference:** ${result.diffPixels} pixels (${percentage}%)\n`;
        }
        if (result.diffPath) {
          report += `- **Diff Image:** ${result.diffPath}\n`;
        }
        report += `\n`;
      });
    }
    
    if (passedTests > 0) {
      report += `## Passed Tests (${passedTests})\n\n`;
      results.filter(r => r.passed).forEach(result => {
        report += `- ✅ ${result.testName}\n`;
      });
    }
    
    return report;
  }

  /**
   * Clean up old diff images
   */
  cleanupDiffs(olderThanDays: number = 7): void {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    if (fs.existsSync(this.diffDir)) {
      const files = fs.readdirSync(this.diffDir);
      
      files.forEach(file => {
        const filePath = path.join(this.diffDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
        }
      });
    }
  }
}