#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ChromaGen Production Environment...\n');

// Function to run a command
function runCommand(command, args, cwd, label, color = '\x1b[36m') {
  const process = spawn(command, args, {
    cwd: path.resolve(cwd),
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${label}]\x1b[0m ${line}`);
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (!line.includes('ExperimentalWarning')) { // Filter out Node warnings
        console.log(`\x1b[31m[${label} ERROR]\x1b[0m ${line}`);
      }
    });
  });

  return process;
}

// Build and start backend
console.log('🔧 Building and starting backend...');
const backend = runCommand('node', ['dist/server-simple.js'], './backend', 'BACKEND', '\x1b[32m');

// Wait then start frontend
setTimeout(() => {
  console.log('🎨 Starting frontend...');
  const frontend = runCommand('npm', ['run', 'dev'], './frontend', 'FRONTEND', '\x1b[34m');
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down ChromaGen...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}, 2000);

console.log('\n✅ ChromaGen Production Environment Started!');
console.log('📱 Frontend: http://localhost:3000');
console.log('🔧 Backend: http://localhost:3333');
console.log('\n🎯 Features Available:');
console.log('   🎨 AI-powered text-based palette generation');
console.log('   🖼️  Real image color extraction');
console.log('   ♿ WCAG AA/AAA accessibility alternatives');
console.log('   👁️  Color blindness friendly options');
console.log('   📋 Multiple color formats (HEX, RGB, HSL, CSS)');
console.log('   📚 Palette history and management');
console.log('   🧠 Color psychology and usage explanations');
console.log('   📱 Fully responsive design');
console.log('\nPress Ctrl+C to stop all servers\n');