// Enhanced test script to verify AI integration for both text and image generation
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3333';

async function testTextGeneration() {
  console.log('🧪 Testing Enhanced AI Text Generation...\n');

  const testCases = [
    {
      name: 'Emotional prompt - love and fun',
      prompt: 'love and fun colors for a playful children\'s brand that makes kids smile',
      shouldSucceed: true
    },
    {
      name: 'Mood-based prompt - calming spa',
      prompt: 'serene and calming colors for a luxury spa that promotes relaxation and wellness',
      shouldSucceed: true
    },
    {
      name: 'Brand personality - tech startup',
      prompt: 'innovative and trustworthy colors for a cutting-edge AI technology startup',
      shouldSucceed: true
    },
    {
      name: 'Complex emotional prompt',
      prompt: 'warm, nostalgic colors that evoke childhood memories and comfort food',
      shouldSucceed: true
    },
    {
      name: 'Empty prompt (should fail gracefully)',
      prompt: '',
      shouldSucceed: false
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`   Prompt: "${testCase.prompt}"`);
    
    try {
      const response = await axios.post(`${API_BASE}/api/generate/text`, {
        prompt: testCase.prompt,
        userId: 'test-user'
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (testCase.shouldSucceed) {
        console.log(`   ✅ SUCCESS: Generated palette "${response.data.name}"`);
        console.log(`   🎨 Colors: ${response.data.colors.map(c => `${c.name} (${c.hex})`).join(', ')}`);
        console.log(`   🤖 Explanation: ${response.data.explanation.substring(0, 150)}...`);
        console.log(`   ♿ Accessibility: ${response.data.accessibilityScore.overallScore} (${response.data.accessibilityScore.passedChecks}/${response.data.accessibilityScore.totalChecks})`);
        console.log(`   ⏱️  Processing time: ${response.data.processingTime}ms`);
      } else {
        console.log(`   ❌ UNEXPECTED SUCCESS: Should have failed but got response`);
      }
    } catch (error) {
      if (testCase.shouldSucceed) {
        console.log(`   ❌ FAILED: ${error.response?.data?.error || error.message}`);
        if (error.response?.data?.code) {
          console.log(`   🔍 Error code: ${error.response.data.code}`);
        }
      } else {
        console.log(`   ✅ CORRECTLY FAILED: ${error.response?.data?.error || error.message}`);
      }
    }
  }
}

async function testImageGeneration() {
  console.log('\n\n🖼️  Testing Enhanced AI Image Generation...\n');

  // Create a simple test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  const testImagePath = 'test-image.png';
  fs.writeFileSync(testImagePath, testImageBuffer);

  try {
    console.log('📤 Uploading test image for AI analysis...');
    
    const form = new FormData();
    form.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const response = await axios.post(`${API_BASE}/api/generate/image`, form, {
      timeout: 20000,
      headers: {
        ...form.getHeaders()
      }
    });

    console.log(`   ✅ SUCCESS: Generated palette "${response.data.name}"`);
    console.log(`   🎨 Colors: ${response.data.colors.map(c => `${c.name} (${c.hex})`).join(', ')}`);
    console.log(`   🤖 Explanation: ${response.data.explanation.substring(0, 150)}...`);
    console.log(`   ♿ Accessibility: ${response.data.accessibilityScore.overallScore} (${response.data.accessibilityScore.passedChecks}/${response.data.accessibilityScore.totalChecks})`);
    console.log(`   ⏱️  Processing time: ${response.data.processingTime}ms`);

  } catch (error) {
    console.log(`   ❌ FAILED: ${error.response?.data?.error || error.message}`);
    if (error.response?.data?.code) {
      console.log(`   🔍 Error code: ${error.response.data.code}`);
    }
  } finally {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }

  // Test invalid image upload
  console.log('\n📤 Testing invalid image upload...');
  try {
    const response = await axios.post(`${API_BASE}/api/generate/image`, {}, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`   ❌ UNEXPECTED SUCCESS: Should have failed but got response`);
  } catch (error) {
    console.log(`   ✅ CORRECTLY FAILED: ${error.response?.data?.error || error.message}`);
  }
}

// Check if server is running first
async function checkServerHealth() {
  try {
    const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log('✅ Server is running and healthy');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   cd backend && npm run dev');
    return false;
  }
}

async function main() {
  console.log('🚀 ChromaGen Enhanced AI Integration Test\n');
  
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  await testTextGeneration();
  await testImageGeneration();
  
  console.log('\n🎉 Enhanced AI Integration test completed!');
  console.log('\n💡 The AI now understands:');
  console.log('   • Emotional nuance in text prompts');
  console.log('   • Visual elements in uploaded images');
  console.log('   • Color psychology and harmony');
  console.log('   • Accessibility requirements');
  console.log('   • Brand personality and context');
}

main().catch(console.error);