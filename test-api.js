// Simple API test
const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing ChromaGen API...\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3333/health');
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test API test endpoint
    console.log('\n2. Testing API test endpoint...');
    const testResponse = await axios.get('http://localhost:3333/api/test');
    console.log('✅ API test passed:', testResponse.data.message);
    
    // Test color generation
    console.log('\n3. Testing color generation...');
    const generateResponse = await axios.post('http://localhost:3333/api/generate/text', {
      prompt: 'ocean blue theme',
      userId: 'test-user'
    });
    console.log('✅ Color generation passed:', generateResponse.data.name);
    console.log('   Generated colors:', generateResponse.data.colors.length);
    
    console.log('\n🎉 All tests passed! ChromaGen API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAPI();