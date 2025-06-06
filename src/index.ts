import { Command } from 'commander';
import chalk from 'chalk';
import { browserCommand } from './commands/browser';
import { authCommand } from './commands/auth';
import { sessionsCommand } from './commands/sessions';
import { version } from '../package.json';

const program = new Command();

program
  .name('xtest')
  .description('xtest CLI - Control and view browser sessions locally')
  .version(version);

// Add commands
program.addCommand(authCommand);
program.addCommand(browserCommand);
program.addCommand(sessionsCommand);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║        Welcome to xtest CLI! 🚀       ║
╚═══════════════════════════════════════╝
`));
  program.outputHelp();
} 