#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ChromaGen Development Environment...\n');

// Function to run a command in a specific directory
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
      console.log(`\x1b[31m[${label} ERROR]\x1b[0m ${line}`);
    });
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`\x1b[31m[${label}] Process exited with code ${code}\x1b[0m`);
    }
  });

  return process;
}

// Start backend
console.log('📦 Starting Backend Server...');
const backend = runCommand('npm', ['run', 'dev'], './backend', 'BACKEND', '\x1b[32m');

// Wait a bit then start frontend
setTimeout(() => {
  console.log('🎨 Starting Frontend Server...');
  const frontend = runCommand('npm', ['run', 'dev'], './frontend', 'FRONTEND', '\x1b[34m');
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  process.exit(0);
});

console.log('\n✅ Development environment started!');
console.log('📱 Frontend: http://localhost:3000');
console.log('🔧 Backend:  http://localhost:3002');
console.log('💾 API Test: http://localhost:3002/api/test');
console.log('\nPress Ctrl+C to stop all servers\n');