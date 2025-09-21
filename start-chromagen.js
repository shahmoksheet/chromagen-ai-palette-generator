#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ChromaGen - AI Color Palette Generator\n');

// Kill any existing processes on our ports
console.log('🧹 Cleaning up existing processes...');

// Start backend
console.log('📦 Starting Backend Server on port 3333...');
const backend = spawn('node', ['dist/server-simple.js'], {
  cwd: path.resolve('./backend'),
  stdio: 'pipe',
  shell: true
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    console.log(`\x1b[32m[BACKEND]\x1b[0m ${line}`);
  });
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    console.log(`\x1b[31m[BACKEND ERROR]\x1b[0m ${line}`);
  });
});

// Wait 3 seconds then start frontend
setTimeout(() => {
  console.log('🎨 Starting Frontend Server...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve('./frontend'),
    stdio: 'pipe',
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`\x1b[34m[FRONTEND]\x1b[0m ${line}`);
    });
  });

  frontend.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`\x1b[33m[FRONTEND WARN]\x1b[0m ${line}`);
    });
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down ChromaGen...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

}, 3000);

console.log('\n✅ ChromaGen is starting up!');
console.log('📱 Frontend will be available at: http://localhost:3000');
console.log('🔧 Backend API at: http://localhost:3333');
console.log('💾 API Test: http://localhost:3333/api/test');
console.log('🎨 Generate Text: http://localhost:3333/api/generate/text');
console.log('🖼️  Generate Image: http://localhost:3333/api/generate/image');
console.log('💾 Save Palette: http://localhost:3333/api/palettes/save');
console.log('📚 Palette History: http://localhost:3333/api/palettes/history/:userId');
console.log('\n🧪 Test all features: node test-full-features.js');
console.log('\nPress Ctrl+C to stop all servers\n');