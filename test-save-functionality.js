// Test script to verify palette save functionality
const axios = require('axios');

const API_BASE = 'http://localhost:3333';
const TEST_USER_ID = 'test-user-123';

async function testSaveFunctionality() {
  console.log('🧪 Testing Palette Save Functionality...\n');

  try {
    // Step 1: Generate a palette
    console.log('📝 Step 1: Generating a test palette...');
    const generateResponse = await axios.post(`${API_BASE}/api/generate/text`, {
      prompt: 'love and fun colors for testing save functionality',
      userId: TEST_USER_ID
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    const generatedPalette = generateResponse.data;
    console.log(`   ✅ Generated palette: "${generatedPalette.name}"`);
    console.log(`   🎨 Colors: ${generatedPalette.colors.length} colors`);

    // Step 2: Save the palette
    console.log('\n💾 Step 2: Saving the palette to history...');
    const saveResponse = await axios.post(`${API_BASE}/api/palettes/save`, {
      name: generatedPalette.name,
      prompt: generatedPalette.prompt,
      colors: generatedPalette.colors,
      accessibilityScore: generatedPalette.accessibilityScore,
      userId: TEST_USER_ID
    }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    const savedPalette = saveResponse.data;
    console.log(`   ✅ Palette saved successfully!`);
    console.log(`   🆔 Saved ID: ${savedPalette.id}`);
    console.log(`   📛 Name: ${savedPalette.name}`);

    // Step 3: Retrieve history to verify save
    console.log('\n📚 Step 3: Retrieving palette history...');
    const historyResponse = await axios.get(`${API_BASE}/api/palettes/history/${TEST_USER_ID}?page=1&limit=10`, {
      timeout: 5000
    });

    const history = historyResponse.data;
    console.log(`   ✅ Retrieved history successfully!`);
    console.log(`   📊 Total palettes: ${history.total}`);
    console.log(`   📄 Current page: ${history.page}/${history.totalPages}`);
    
    if (history.palettes && history.palettes.length > 0) {
      console.log(`   🎨 Recent palettes:`);
      history.palettes.forEach((palette, index) => {
        console.log(`      ${index + 1}. "${palette.name}" (${palette.colors.length} colors) - ${palette.createdAt}`);
      });

      // Verify our saved palette is in the history
      const foundPalette = history.palettes.find(p => p.id === savedPalette.id);
      if (foundPalette) {
        console.log(`   ✅ Saved palette found in history!`);
      } else {
        console.log(`   ❌ Saved palette NOT found in history!`);
      }
    } else {
      console.log(`   ⚠️  No palettes found in history`);
    }

    // Step 4: Test saving another palette
    console.log('\n💾 Step 4: Saving another palette...');
    const secondSaveResponse = await axios.post(`${API_BASE}/api/palettes/save`, {
      name: 'Test Palette #2',
      prompt: 'ocean blue colors for testing',
      colors: [
        {
          hex: '#0077BE',
          rgb: { r: 0, g: 119, b: 190 },
          hsl: { h: 202, s: 100, l: 37 },
          name: 'Ocean Blue',
          category: 'primary',
          usage: 'Primary brand color',
          accessibility: { contrastWithWhite: 4.5, contrastWithBlack: 9.3, wcagLevel: 'AA' }
        }
      ],
      accessibilityScore: { overallScore: 'AA', passedChecks: 1, totalChecks: 1, recommendations: [] },
      userId: TEST_USER_ID
    }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`   ✅ Second palette saved: "${secondSaveResponse.data.name}"`);

    // Step 5: Check updated history
    console.log('\n📚 Step 5: Checking updated history...');
    const updatedHistoryResponse = await axios.get(`${API_BASE}/api/palettes/history/${TEST_USER_ID}?page=1&limit=10`, {
      timeout: 5000
    });

    const updatedHistory = updatedHistoryResponse.data;
    console.log(`   ✅ Updated history retrieved!`);
    console.log(`   📊 Total palettes: ${updatedHistory.total}`);
    
    if (updatedHistory.palettes && updatedHistory.palettes.length > 0) {
      console.log(`   🎨 All palettes:`);
      updatedHistory.palettes.forEach((palette, index) => {
        console.log(`      ${index + 1}. "${palette.name}" - ${new Date(palette.createdAt).toLocaleString()}`);
      });
    }

    // Step 6: Test delete functionality
    console.log('\n🗑️  Step 6: Testing delete functionality...');
    const deleteResponse = await axios.delete(`${API_BASE}/api/palettes/${savedPalette.id}?userId=${TEST_USER_ID}`, {
      timeout: 5000
    });

    console.log(`   ✅ Delete response: ${deleteResponse.data.message}`);

    // Step 7: Verify deletion
    console.log('\n📚 Step 7: Verifying deletion...');
    const finalHistoryResponse = await axios.get(`${API_BASE}/api/palettes/history/${TEST_USER_ID}?page=1&limit=10`, {
      timeout: 5000
    });

    const finalHistory = finalHistoryResponse.data;
    console.log(`   📊 Final total palettes: ${finalHistory.total}`);
    
    const deletedPaletteStillExists = finalHistory.palettes.find(p => p.id === savedPalette.id);
    if (!deletedPaletteStillExists) {
      console.log(`   ✅ Palette successfully deleted from history!`);
    } else {
      console.log(`   ❌ Palette still exists in history after deletion!`);
    }

    console.log('\n🎉 Save functionality test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
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
  console.log('🚀 ChromaGen Save Functionality Test\n');
  
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  await testSaveFunctionality();
}

main().catch(console.error);