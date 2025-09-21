// Simple generation test
const axios = require('axios');

async function testSimpleGeneration() {
  try {
    console.log('🧪 Testing Simple Generation...\n');
    
    const response = await axios.post('http://localhost:3333/api/generate/text', {
      prompt: 'blue theme',
      userId: 'test'
    });
    
    console.log('✅ Generation successful!');
    console.log('Name:', response.data.name);
    console.log('Colors:', response.data.colors.length);
    console.log('First color:', response.data.colors[0]);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

testSimpleGeneration();