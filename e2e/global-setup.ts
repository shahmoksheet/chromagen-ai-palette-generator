import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Wait for services to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Wait for frontend to be ready
  let frontendReady = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!frontendReady && attempts < maxAttempts) {
    try {
      await page.goto('http://localhost:3000', { timeout: 2000 });
      frontendReady = true;
      console.log('✅ Frontend is ready');
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for frontend... (${attempts}/${maxAttempts})`);
      await page.waitForTimeout(2000);
    }
  }
  
  // Wait for backend to be ready
  let backendReady = false;
  attempts = 0;
  
  while (!backendReady && attempts < maxAttempts) {
    try {
      const response = await page.request.get('http://localhost:3001/api/health');
      if (response.ok()) {
        backendReady = true;
        console.log('✅ Backend is ready');
      }
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for backend... (${attempts}/${maxAttempts})`);
      await page.waitForTimeout(2000);
    }
  }
  
  await browser.close();
  
  if (!frontendReady || !backendReady) {
    throw new Error('Services failed to start within timeout period');
  }
  
  console.log('✅ Global setup completed');
}

export default globalSetup;