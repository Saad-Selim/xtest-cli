#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { browserCommand } from './commands/browser';
import { authCommand } from './commands/auth';
import { sessionsCommand } from './commands/sessions';
import { dualCommand } from './commands/dual';
import { dual2Command } from './commands/dual-v2';
import { dualInteractiveCommand } from './commands/dual-interactive';
import { mirrorCommand } from './commands/mirror';
import { version } from '../package.json';
import { getConfig } from './utils/config';

const program = new Command();

// Custom help display
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage(),
});

program
  .name('xtest')
  .description('xtest CLI - Control browser automation sessions from your local machine')
  .version(version, '-v, --version', 'Display CLI version')
  .addHelpText('before', () => {
    return chalk.cyan('\n' + '═'.repeat(60)) + '\n' +
           chalk.cyan.bold('  xtest CLI') + chalk.gray(` v${version}`) + '\n' +
           chalk.cyan('  Browser Automation Made Simple') + '\n' +
           chalk.cyan('═'.repeat(60)) + '\n';
  })
  .addHelpText('after', () => {
    return '\n' + chalk.gray('For more information, visit: ') + chalk.cyan('https://xtest.ing/docs/cli') + '\n';
  });

// Add commands
program.addCommand(authCommand);
program.addCommand(browserCommand);
program.addCommand(sessionsCommand);
program.addCommand(dualCommand);
program.addCommand(dual2Command);
program.addCommand(dualInteractiveCommand);
program.addCommand(mirrorCommand);

// Add global error handler
program.exitOverride();

try {
  // Parse command line arguments
  program.parse(process.argv);
} catch (err: any) {
  if (err.code === 'commander.unknownCommand') {
    console.error(chalk.red('\n❌ Unknown command: ') + chalk.yellow(err.message.split(':')[1].trim()));
    console.log(chalk.gray('\nRun ') + chalk.cyan('xtest --help') + chalk.gray(' to see available commands\n'));
  } else {
    console.error(chalk.red('\n❌ Error: ') + err.message + '\n');
  }
  process.exit(1);
}

// Show enhanced help if no command provided
if (!process.argv.slice(2).length) {
  getConfig().then(config => {
    const isAuthenticated = !!config.apiKey;
    
    console.log(chalk.cyan('\n' + '═'.repeat(60)));
    console.log(chalk.cyan.bold('  Welcome to xtest CLI! 🚀'));
    console.log(chalk.gray(`  Version ${version}`));
    console.log(chalk.cyan('═'.repeat(60)) + '\n');
    
    if (!isAuthenticated) {
      console.log(chalk.yellow('📌 Quick Start:\n'));
      console.log(chalk.white('  1. Authenticate with your xtest account:'));
      console.log(chalk.cyan('     xtest auth\n'));
      console.log(chalk.white('  2. Start a browser session:'));
      console.log(chalk.cyan('     xtest browser --interactive\n'));
    } else {
      console.log(chalk.green('✅ You are authenticated!\n'));
      console.log(chalk.white('🚀 Start a browser session:'));
      console.log(chalk.cyan('   xtest browser --interactive\n'));
      console.log(chalk.white('📋 Or use quick commands:'));
      console.log(chalk.gray('   xtest browser                  ') + chalk.gray('# Start with defaults'));
      console.log(chalk.gray('   xtest browser --mode inspector ') + chalk.gray('# Debug mode'));
      console.log(chalk.gray('   xtest sessions list            ') + chalk.gray('# View active sessions\n'));
    }
    
    console.log(chalk.gray('For all commands, run: ') + chalk.cyan('xtest --help'));
    console.log(chalk.gray('For command help, run: ') + chalk.cyan('xtest <command> --help\n'));
  });
} 