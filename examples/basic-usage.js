#!/usr/bin/env node

/**
 * Basic example of using @xtest/cli programmatically
 * 
 * This example shows how to:
 * 1. Authenticate with xtest.ing
 * 2. Start a browser session
 * 3. Wait for user input
 * 4. Close the session
 */

const { spawn } = require('child_process');

// Helper function to run CLI commands
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('xtest', [command, ...args], {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    console.log('🚀 Starting xtest CLI example...\n');

    // Check authentication status
    console.log('📋 Checking authentication status...');
    await runCommand('auth', ['status']);

    // Start browser with inspector
    console.log('\n🌐 Starting browser with inspector mode...');
    await runCommand('browser', ['start', '--inspector']);

    // Wait for user input
    console.log('\n✅ Browser is running! Press Enter to stop...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Stop browser
    console.log('\n🛑 Stopping browser...');
    await runCommand('browser', ['stop']);

    console.log('\n✨ Example completed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main(); 