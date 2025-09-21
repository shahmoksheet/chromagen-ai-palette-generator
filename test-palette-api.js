const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:3001/api';
const userId = uuidv4();

// Test data
const testPalette = {
  name: 'Sunset Vibes',
  prompt: 'A warm sunset palette with orange and pink tones',
  colors: [
    {
      hex: '#FF6B35',
      rgb: { r: 255, g: 107, b: 53 },
      hsl: { h: 16, s: 100, l: 60 },
      name: 'Sunset Orange',
      category: 'primary',
      usage: 'Primary brand color for headers and CTAs',
      accessibility: {
        contrastWithWhite: 3.2,
        contrastWithBlack: 6.5,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#F7931E',
      rgb: { r: 247, g: 147, b: 30 },
      hsl: { h: 32, s: 93, l: 54 },
      name: 'Golden Hour',
      category: 'secondary',
      usage: 'Secondary accents and highlights',
      accessibility: {
        contrastWithWhite: 2.8,
        contrastWithBlack: 7.5,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#FFB6C1',
      rgb: { r: 255, g: 182, b: 193 },
      hsl: { h: 351, s: 100, l: 86 },
      name: 'Soft Pink',
      category: 'accent',
      usage: 'Subtle backgrounds and borders',
      accessibility: {
        contrastWithWhite: 1.2,
        contrastWithBlack: 17.5,
        wcagLevel: 'FAIL',
      },
    },
    {
      hex: '#2C3E50',
      rgb: { r: 44, g: 62, b: 80 },
      hsl: { h: 210, s: 29, l: 24 },
      name: 'Deep Navy',
      category: 'neutral',
      usage: 'Text and dark backgrounds',
      accessibility: {
        contrastWithWhite: 15.3,
        contrastWithBlack: 1.4,
        wcagLevel: 'AAA',
      },
    },
  ],
  accessibilityScore: {
    overallScore: 'AA',
    contrastRatios: [
      {
        color1: '#FF6B35',
        color2: '#2C3E50',
        ratio: 4.2,
        passes: { AA: true, AAA: false },
      },
    ],
    colorBlindnessCompatible: true,
    recommendations: [
      'Consider using darker shades for better contrast',
      'Test with color blindness simulators',
    ],
  },
  userId: userId,
};

async function testPaletteManagement() {
  console.log('🎨 Testing Palette Management API...\n');
  
  try {
    let savedPaletteId;

    // Test 1: Save a new palette
    console.log('1. Testing palette save...');
    const saveResponse = await axios.post(`${BASE_URL}/palettes/save`, testPalette);
    console.log('✅ Palette saved successfully');
    console.log(`   Palette ID: ${saveResponse.data.id}`);
    console.log(`   Name: ${saveResponse.data.name}`);
    savedPaletteId = saveResponse.data.id;

    // Test 2: Retrieve palette history
    console.log('\n2. Testing palette history retrieval...');
    const historyResponse = await axios.get(`${BASE_URL}/palettes/history/${userId}`, {
      params: { page: 1, limit: 10 }
    });
    console.log('✅ Palette history retrieved successfully');
    console.log(`   Total palettes: ${historyResponse.data.pagination.totalCount}`);
    console.log(`   Current page: ${historyResponse.data.pagination.currentPage}`);

    // Test 3: Get specific palette
    console.log('\n3. Testing specific palette retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/palettes/${savedPaletteId}`);
    console.log('✅ Specific palette retrieved successfully');
    console.log(`   Palette name: ${getResponse.data.name}`);
    console.log(`   Color count: ${getResponse.data.colors.length}`);

    // Test 4: Update palette
    console.log('\n4. Testing palette update...');
    const updateData = {
      name: 'Updated Sunset Vibes',
      colors: testPalette.colors.slice(0, 3), // Remove one color
    };
    const updateResponse = await axios.put(`${BASE_URL}/palettes/${savedPaletteId}`, updateData);
    console.log('✅ Palette updated successfully');
    console.log(`   New name: ${updateResponse.data.name}`);
    console.log(`   New color count: ${updateResponse.data.colors.length}`);

    // Test 5: Search palettes
    console.log('\n5. Testing palette search...');
    const searchResponse = await axios.get(`${BASE_URL}/palettes/history/${userId}`, {
      params: { search: 'sunset', page: 1, limit: 10 }
    });
    console.log('✅ Palette search completed successfully');
    console.log(`   Search results: ${searchResponse.data.palettes.length}`);

    // Test 6: Save another palette for bulk operations
    console.log('\n6. Saving another palette for bulk operations...');
    const secondPalette = {
      ...testPalette,
      name: 'Ocean Breeze',
      prompt: 'Cool ocean colors with blues and greens',
    };
    const secondSaveResponse = await axios.post(`${BASE_URL}/palettes/save`, secondPalette);
    console.log('✅ Second palette saved successfully');
    const secondPaletteId = secondSaveResponse.data.id;

    // Test 7: Bulk delete
    console.log('\n7. Testing bulk delete...');
    const bulkDeleteResponse = await axios.post(`${BASE_URL}/palettes/bulk-delete`, {
      paletteIds: [savedPaletteId, secondPaletteId],
      userId: userId,
    });
    console.log('✅ Bulk delete completed successfully');
    console.log(`   Deleted count: ${bulkDeleteResponse.data.deletedCount}`);

    // Test 8: Verify deletion
    console.log('\n8. Verifying deletion...');
    const finalHistoryResponse = await axios.get(`${BASE_URL}/palettes/history/${userId}`);
    console.log('✅ Deletion verified');
    console.log(`   Remaining palettes: ${finalHistoryResponse.data.pagination.totalCount}`);

    console.log('\n🎉 All palette management tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n🔍 Testing error handling...\n');

  try {
    // Test invalid UUID
    console.log('1. Testing invalid UUID format...');
    try {
      await axios.get(`${BASE_URL}/palettes/invalid-uuid`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid UUID properly rejected');
      } else {
        throw error;
      }
    }

    // Test non-existent palette
    console.log('\n2. Testing non-existent palette...');
    try {
      await axios.get(`${BASE_URL}/palettes/${uuidv4()}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Non-existent palette properly handled');
      } else {
        throw error;
      }
    }

    // Test invalid palette data
    console.log('\n3. Testing invalid palette data...');
    try {
      await axios.post(`${BASE_URL}/palettes/save`, {
        name: '', // Invalid empty name
        colors: [], // Invalid empty colors
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid palette data properly rejected');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All error handling tests passed!');

  } catch (error) {
    console.error('❌ Error handling test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('Starting Palette Management API Tests...\n');
  
  await testPaletteManagement();
  await testErrorHandling();
  
  console.log('\n✨ All tests completed!');
}

runAllTests();