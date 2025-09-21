// Complete API test for ChromaGen
const axios = require('axios');

async function testCompleteAPI() {
  const baseURL = 'http://localhost:3333';
  
  try {
    console.log('🧪 Testing Complete ChromaGen API...\n');
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test 2: API test endpoint
    console.log('\n2. Testing API test endpoint...');
    const testResponse = await axios.get(`${baseURL}/api/test`);
    console.log('✅ API test passed:', testResponse.data.message);
    
    // Test 3: Text generation
    console.log('\n3. Testing text-based color generation...');
    const textResponse = await axios.post(`${baseURL}/api/generate/text`, {
      prompt: 'modern tech startup with blue theme',
      userId: 'test-user-123'
    });
    console.log('✅ Text generation passed:', textResponse.data.name);
    console.log('   Colors generated:', textResponse.data.colors.length);
    
    // Test 4: Image generation (mock)
    console.log('\n4. Testing image-based color generation...');
    const imageResponse = await axios.post(`${baseURL}/api/generate/image`, {
      userId: 'test-user-123'
    });
    console.log('✅ Image generation passed:', imageResponse.data.name);
    console.log('   Colors extracted:', imageResponse.data.colors.length);
    
    // Test 5: Save palette
    console.log('\n5. Testing palette save...');
    const saveResponse = await axios.post(`${baseURL}/api/palettes/save`, {
      name: 'Test Palette',
      prompt: 'test colors',
      colors: textResponse.data.colors.slice(0, 3),
      accessibilityScore: textResponse.data.accessibilityScore
    });
    console.log('✅ Palette save passed:', saveResponse.data.name);
    
    // Test 6: Get palette history
    console.log('\n6. Testing palette history...');
    const historyResponse = await axios.get(`${baseURL}/api/palettes/history/test-user-123`);
    console.log('✅ History fetch passed:', historyResponse.data.palettes.length, 'palettes found');
    
    // Test 7: Delete palette (using mock ID)
    console.log('\n7. Testing palette deletion...');
    const deleteResponse = await axios.delete(`${baseURL}/api/palettes/test-palette-id`);
    console.log('✅ Palette deletion passed');
    
    console.log('\n🎉 All API tests passed! ChromaGen is fully functional.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Health check working');
    console.log('   ✅ Text-based generation working');
    console.log('   ✅ Image-based generation working');
    console.log('   ✅ Palette saving working');
    console.log('   ✅ History retrieval working');
    console.log('   ✅ Palette deletion working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.error('\n💡 Make sure the backend is running on port 3333');
  }
}

testCompleteAPI();