import { test, expect } from '@playwright/test';
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

test.describe('Image Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Create test images if they don't exist
    await createTestImages();
  });

  test('should upload and process valid image', async ({ page }) => {
    const imageUpload = page.locator('[data-testid="image-upload"]');
    await expect(imageUpload).toBeVisible();
    
    // Upload test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../test-images/test-image.png'));
    
    // Should show processing state
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
    
    // Should generate palette from image
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 15000 });
    
    // Should have extracted colors
    const colorItems = page.locator('[data-testid="color-item"]');
    await expect(colorItems).toHaveCount.greaterThan(3);
  });

  test('should handle drag and drop upload', async ({ page }) => {
    const imageUpload = page.locator('[data-testid="image-upload"]');
    
    // Create a file for drag and drop
    const testImagePath = path.join(__dirname, '../test-images/test-image.png');
    const fileBuffer = fs.readFileSync(testImagePath);
    
    // Simulate drag and drop
    const dataTransfer = await page.evaluateHandle((fileBuffer) => {
      const dt = new DataTransfer();
      const file = new File([new Uint8Array(fileBuffer)], 'test-image.png', { type: 'image/png' });
      dt.items.add(file);
      return dt;
    }, Array.from(fileBuffer));
    
    await imageUpload.dispatchEvent('drop', { dataTransfer });
    
    // Should process the dropped image
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 15000 });
  });

  test('should reject invalid file types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload a text file
    const textFilePath = path.join(__dirname, '../test-images/invalid.txt');
    fs.writeFileSync(textFilePath, 'This is not an image');
    
    await fileInput.setInputFiles(textFilePath);
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid file type');
    
    // Clean up
    fs.unlinkSync(textFilePath);
  });

  test('should reject oversized images', async ({ page }) => {
    // Create a large test image (simulate > 5MB)
    const largeImagePath = path.join(__dirname, '../test-images/large-image.png');
    await createLargeTestImage(largeImagePath);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largeImagePath);
    
    // Should show size error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('too large');
    
    // Clean up
    fs.unlinkSync(largeImagePath);
  });

  test('should show image preview', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../test-images/test-image.png'));
    
    // Should show image preview
    const imagePreview = page.locator('[data-testid="image-preview"]');
    await expect(imagePreview).toBeVisible();
    
    // Preview should have src attribute
    const src = await imagePreview.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('blob:');
  });

  test('should handle multiple image formats', async ({ page }) => {
    const formats = ['png', 'jpg', 'jpeg', 'webp'];
    
    for (const format of formats) {
      const imagePath = path.join(__dirname, `../test-images/test-image.${format}`);
      await createTestImageWithFormat(imagePath, format);
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(imagePath);
      
      // Should process each format
      await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 15000 });
      
      // Clear for next test
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should extract dominant colors accurately', async ({ page }) => {
    // Create an image with known colors
    const coloredImagePath = path.join(__dirname, '../test-images/colored-image.png');
    await createColoredTestImage(coloredImagePath);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(coloredImagePath);
    
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 15000 });
    
    // Check that extracted colors are reasonable
    const colorItems = page.locator('[data-testid="color-item"]');
    const count = await colorItems.count();
    expect(count).toBeGreaterThan(2);
    
    // Check color values
    for (let i = 0; i < Math.min(count, 3); i++) {
      const colorHex = await colorItems.nth(i).locator('[data-testid="color-hex"]').textContent();
      expect(colorHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

// Helper functions to create test images
async function createTestImages() {
  const testImagesDir = path.join(__dirname, '../test-images');
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
  }
  
  // Create basic test image
  const testImagePath = path.join(testImagesDir, 'test-image.png');
  if (!fs.existsSync(testImagePath)) {
    await createBasicTestImage(testImagePath);
  }
}

async function createBasicTestImage(filePath: string) {
  // This would normally use a canvas library, but for testing we'll create a simple PNG
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Create a simple gradient
  const gradient = ctx.createLinearGradient(0, 0, 200, 200);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.5, '#00ff00');
  gradient.addColorStop(1, '#0000ff');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 200, 200);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

async function createLargeTestImage(filePath: string) {
  // Create a large image (simulate > 5MB)
  const canvas = createCanvas(2000, 2000);
  const ctx = canvas.getContext('2d');
  
  // Fill with random colors to increase file size
  for (let x = 0; x < 2000; x += 10) {
    for (let y = 0; y < 2000; y += 10) {
      ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
      ctx.fillRect(x, y, 10, 10);
    }
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

async function createTestImageWithFormat(filePath: string, format: string) {
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(0, 0, 100, 100);
  
  let mimeType = 'image/png';
  if (format === 'jpg' || format === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (format === 'webp') {
    mimeType = 'image/webp';
  }
  
  const buffer = canvas.toBuffer(mimeType as any);
  fs.writeFileSync(filePath, buffer);
}

async function createColoredTestImage(filePath: string) {
  const canvas = createCanvas(300, 300);
  const ctx = canvas.getContext('2d');
  
  // Create distinct color blocks
  ctx.fillStyle = '#ff0000'; // Red
  ctx.fillRect(0, 0, 100, 100);
  
  ctx.fillStyle = '#00ff00'; // Green
  ctx.fillRect(100, 0, 100, 100);
  
  ctx.fillStyle = '#0000ff'; // Blue
  ctx.fillRect(200, 0, 100, 100);
  
  ctx.fillStyle = '#ffff00'; // Yellow
  ctx.fillRect(0, 100, 150, 200);
  
  ctx.fillStyle = '#ff00ff'; // Magenta
  ctx.fillRect(150, 100, 150, 200);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}