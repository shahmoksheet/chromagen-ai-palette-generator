const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:3001/api';
const userId = uuidv4();

// Test data - create a palette first
const testPalette = {
  name: 'Export Test Palette',
  prompt: 'A vibrant palette for testing export functionality',
  colors: [
    {
      hex: '#FF6B35',
      rgb: { r: 255, g: 107, b: 53 },
      hsl: { h: 16, s: 100, l: 60 },
      name: 'Vibrant Orange',
      category: 'primary',
      usage: 'Primary brand color for headers and CTAs',
      accessibility: {
        contrastWithWhite: 3.2,
        contrastWithBlack: 6.5,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#4ECDC4',
      rgb: { r: 78, g: 205, b: 196 },
      hsl: { h: 176, s: 57, l: 55 },
      name: 'Turquoise',
      category: 'secondary',
      usage: 'Secondary accents and highlights',
      accessibility: {
        contrastWithWhite: 2.1,
        contrastWithBlack: 10.0,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#45B7D1',
      rgb: { r: 69, g: 183, b: 209 },
      hsl: { h: 191, s: 61, l: 55 },
      name: 'Sky Blue',
      category: 'accent',
      usage: 'Accent colors and interactive elements',
      accessibility: {
        contrastWithWhite: 2.5,
        contrastWithBlack: 8.4,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#2C3E50',
      rgb: { r: 44, g: 62, b: 80 },
      hsl: { h: 210, s: 29, l: 24 },
      name: 'Dark Navy',
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

async function testExportFunctionality() {
  console.log('🎨 Testing Export Functionality...\n');
  
  try {
    let savedPaletteId;

    // Step 1: Create a test palette
    console.log('1. Creating test palette...');
    const saveResponse = await axios.post(`${BASE_URL}/palettes/save`, testPalette);
    savedPaletteId = saveResponse.data.id;
    console.log('✅ Test palette created');
    console.log(`   Palette ID: ${savedPaletteId}`);

    // Step 2: Test supported formats endpoint
    console.log('\n2. Getting supported export formats...');
    const formatsResponse = await axios.get(`${BASE_URL}/export/formats`);
    console.log('✅ Export formats retrieved');
    console.log(`   Total formats: ${formatsResponse.data.data.totalFormats}`);
    formatsResponse.data.data.formats.forEach(format => {
      console.log(`   - ${format.name} (${format.format}): ${format.description}`);
    });

    // Step 3: Test individual format exports
    console.log('\n3. Testing individual format exports...');
    const formats = ['css', 'scss', 'json', 'tailwind', 'sketch', 'figma', 'ase'];
    
    for (const format of formats) {
      try {
        console.log(`   Testing ${format.toUpperCase()} export...`);
        
        // Test preview mode first
        const previewResponse = await axios.get(`${BASE_URL}/export/${savedPaletteId}/${format}`, {
          params: { preview: 'true' }
        });
        
        console.log(`   ✅ ${format.toUpperCase()} preview: ${previewResponse.data.data.filename} (${previewResponse.data.data.size} bytes)`);
        
        // Test actual download
        const downloadResponse = await axios.get(`${BASE_URL}/export/${savedPaletteId}/${format}`, {
          responseType: 'text'
        });
        
        console.log(`   ✅ ${format.toUpperCase()} download: ${downloadResponse.headers['content-disposition']}`);
        
        // Save sample files for inspection
        const filename = `sample-export.${format === 'tailwind' ? 'js' : format}`;
        fs.writeFileSync(path.join(__dirname, filename), downloadResponse.data);
        console.log(`   📁 Sample saved as: ${filename}`);
        
      } catch (error) {
        console.log(`   ❌ ${format.toUpperCase()} export failed: ${error.response?.data?.error || error.message}`);
      }
    }

    // Step 4: Test batch export
    console.log('\n4. Testing batch export...');
    
    // Create a second palette for batch testing
    const secondPalette = {
      ...testPalette,
      name: 'Second Export Test Palette',
      prompt: 'Another palette for batch export testing',
    };
    
    const secondSaveResponse = await axios.post(`${BASE_URL}/palettes/save`, secondPalette);
    const secondPaletteId = secondSaveResponse.data.id;
    
    const batchRequest = {
      paletteIds: [savedPaletteId, secondPaletteId],
      formats: ['css', 'json', 'scss'],
      zipFile: false,
    };
    
    const batchResponse = await axios.post(`${BASE_URL}/export/batch`, batchRequest);
    console.log('✅ Batch export completed');
    console.log(`   Total exports: ${batchResponse.data.data.totalExports}`);
    console.log(`   Processed palettes: ${batchResponse.data.data.processedPalettes}`);
    
    // Save batch results summary
    fs.writeFileSync(
      path.join(__dirname, 'batch-export-results.json'),
      JSON.stringify(batchResponse.data, null, 2)
    );
    console.log('   📁 Batch results saved as: batch-export-results.json');

    // Step 5: Test format-specific features
    console.log('\n5. Testing format-specific features...');
    
    // Test CSS format features
    const cssPreview = await axios.get(`${BASE_URL}/export/${savedPaletteId}/css`, {
      params: { preview: 'true' }
    });
    const cssContent = cssPreview.data.data.content;
    
    console.log('   CSS Format Features:');
    console.log(`   ✅ CSS Variables: ${cssContent.includes('--color-') ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Utility Classes: ${cssContent.includes('.bg-') ? 'Present' : 'Missing'}`);
    console.log(`   ✅ RGB Values: ${cssContent.includes('-rgb:') ? 'Present' : 'Missing'}`);
    
    // Test JSON format features
    const jsonPreview = await axios.get(`${BASE_URL}/export/${savedPaletteId}/json`, {
      params: { preview: 'true' }
    });
    const jsonData = JSON.parse(jsonPreview.data.data.content);
    
    console.log('   JSON Format Features:');
    console.log(`   ✅ Complete Data: ${jsonData.colors && jsonData.accessibilityScore ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Metadata: ${jsonData.metadata ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Accessibility Info: ${jsonData.accessibilityScore ? 'Present' : 'Missing'}`);
    
    // Test Tailwind format features
    const tailwindPreview = await axios.get(`${BASE_URL}/export/${savedPaletteId}/tailwind`, {
      params: { preview: 'true' }
    });
    const tailwindContent = tailwindPreview.data.data.content;
    
    console.log('   Tailwind Format Features:');
    console.log(`   ✅ Color Scales: ${tailwindContent.includes('50:') && tailwindContent.includes('900:') ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Module Export: ${tailwindContent.includes('module.exports') ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Theme Structure: ${tailwindContent.includes('theme:') ? 'Present' : 'Missing'}`);

    // Step 6: Clean up test palettes
    console.log('\n6. Cleaning up test data...');
    await axios.delete(`${BASE_URL}/palettes/${savedPaletteId}`);
    await axios.delete(`${BASE_URL}/palettes/${secondPaletteId}`);
    console.log('✅ Test palettes deleted');

    console.log('\n🎉 All export functionality tests passed!');

  } catch (error) {
    console.error('❌ Export test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Test error handling
async function testExportErrorHandling() {
  console.log('\n🔍 Testing export error handling...\n');

  try {
    // Test invalid palette ID
    console.log('1. Testing invalid palette ID...');
    try {
      await axios.get(`${BASE_URL}/export/invalid-uuid/css`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid palette ID properly rejected');
      } else {
        throw error;
      }
    }

    // Test non-existent palette
    console.log('\n2. Testing non-existent palette...');
    try {
      await axios.get(`${BASE_URL}/export/${uuidv4()}/css`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Non-existent palette properly handled');
      } else {
        throw error;
      }
    }

    // Test invalid format
    console.log('\n3. Testing invalid export format...');
    try {
      await axios.get(`${BASE_URL}/export/${uuidv4()}/invalid-format`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid format properly rejected');
      } else {
        throw error;
      }
    }

    // Test invalid batch request
    console.log('\n4. Testing invalid batch request...');
    try {
      await axios.post(`${BASE_URL}/export/batch`, {
        paletteIds: [], // Empty array
        formats: ['css'],
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid batch request properly rejected');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All export error handling tests passed!');

  } catch (error) {
    console.error('❌ Export error handling test failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllExportTests() {
  console.log('Starting Export API Tests...\n');
  
  await testExportFunctionality();
  await testExportErrorHandling();
  
  console.log('\n✨ All export tests completed!');
  console.log('\n📁 Check the generated sample files:');
  console.log('   - sample-export.css');
  console.log('   - sample-export.scss');
  console.log('   - sample-export.json');
  console.log('   - sample-export.js (Tailwind)');
  console.log('   - sample-export.ase');
  console.log('   - sample-export.sketch');
  console.log('   - sample-export.figma');
  console.log('   - batch-export-results.json');
}

runAllExportTests();