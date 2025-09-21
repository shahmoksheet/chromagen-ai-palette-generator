// Test all ChromaGen features
const axios = require('axios');

async function testAllFeatures() {
  const baseURL = 'http://localhost:3333';
  
  try {
    console.log('🚀 Testing All ChromaGen Features...\n');
    
    // Test 1: Backend Health
    console.log('1. Testing backend health...');
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend healthy:', health.data.status);
    
    // Test 2: Text Generation
    console.log('\n2. Testing text generation...');
    const textGen = await axios.post(`${baseURL}/api/generate/text`, {
      prompt: 'modern blue corporate theme',
      userId: 'test-user'
    });
    console.log('✅ Text generation:', textGen.data.name);
    console.log('   Colors:', textGen.data.colors.map(c => `${c.name} (${c.hex})`).join(', '));
    
    // Test 3: Image Generation
    console.log('\n3. Testing image generation...');
    const imageGen = await axios.post(`${baseURL}/api/generate/image`, {
      userId: 'test-user'
    });
    console.log('✅ Image generation:', imageGen.data.name);
    console.log('   Colors:', imageGen.data.colors.map(c => `${c.name} (${c.hex})`).join(', '));
    
    // Test 4: Palette Save
    console.log('\n4. Testing palette save...');
    const save = await axios.post(`${baseURL}/api/palettes/save`, {
      name: 'Test Full Feature Palette',
      prompt: textGen.data.prompt,
      colors: textGen.data.colors.slice(0, 3),
      accessibilityScore: textGen.data.accessibilityScore
    });
    console.log('✅ Palette saved:', save.data.name);
    
    // Test 5: Palette History
    console.log('\n5. Testing palette history...');
    const history = await axios.get(`${baseURL}/api/palettes/history/test-user`);
    console.log('✅ History loaded:', history.data.palettes.length, 'palettes');
    
    console.log('\n🎉 All backend features working!');
    console.log('\n📋 Frontend Features to Test:');
    console.log('   🎨 Text-based generation with switch UI');
    console.log('   🖼️  Image upload with real color extraction');
    console.log('   📋 Multiple color format copying (HEX, RGB, HSL, CSS)');
    console.log('   ♿ WCAG alternatives with AA/AAA options');
    console.log('   👁️  Color blindness friendly alternatives');
    console.log('   📚 Palette history management');
    console.log('   🎯 Color psychology and usage explanations');
    console.log('   📱 Responsive design for all devices');
    
    console.log('\n🚀 Open http://localhost:3000 to test the full application!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAllFeatures();