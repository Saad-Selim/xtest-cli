#!/usr/bin/env node

const isGlobal = process.env.npm_config_global === 'true';

if (!isGlobal) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║   ⚠️  WARNING: @xtest-cli/cli should be installed globally!   ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log('This CLI tool needs to be installed globally to work properly.\n');
  console.log('Please uninstall and reinstall with:\n');
  console.log('  npm uninstall @xtest-cli/cli');
  console.log('  npm install -g @xtest-cli/cli@latest\n');
  console.log('This will make the \'xtest\' command available globally.\n');
  console.log('─'.repeat(64) + '\n');
} 