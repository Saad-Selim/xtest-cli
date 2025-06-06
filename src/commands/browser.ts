import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { BrowserController } from '../browser/controller';
import { getConfig } from '../utils/config';

export const browserCommand = new Command('browser')
  .description('Control browser sessions locally')
  .option('-s, --session <id>', 'Session ID to connect to')
  .option('-m, --mode <mode>', 'Browser mode: inspector, headed, headless', 'inspector')
  .option('-b, --browser <type>', 'Browser type: chromium, firefox, webkit', 'chromium')
  .option('--devtools', 'Open DevTools automatically', true)
  .option('--slow-mo <ms>', 'Slow down actions by specified milliseconds', '100')
  .option('--record', 'Record the session locally')
  .action(async (options) => {
    const spinner = ora('Initializing browser session...').start();
    
    try {
      // Get authentication config
      const config = await getConfig();
      if (!config.apiKey) {
        spinner.fail('Not authenticated');
        console.log(chalk.yellow('Please run "xtest auth" first'));
        process.exit(1);
      }

      // Generate session ID if not provided
      const sessionId = options.session || `cli-${Date.now()}`;
      
      spinner.text = 'Launching browser...';
      
      // Create browser controller
      const controller = new BrowserController({
        sessionId,
        serverUrl: config.serverUrl,
        apiKey: config.apiKey,
        browserOptions: {
          mode: options.mode,
          browserType: options.browser,
          devtools: options.devtools && options.mode !== 'headless',
          slowMo: parseInt(options.slowMo),
          record: options.record,
        },
      });

      // Start the browser session
      await controller.start();
      
      spinner.succeed('Browser session started');
      
      console.log(chalk.green(`
╔═══════════════════════════════════════════════════╗
║           🚀 Browser Session Active               ║
╚═══════════════════════════════════════════════════╝
`));
      
      console.log(chalk.cyan('Session ID:'), sessionId);
      console.log(chalk.cyan('Mode:'), options.mode);
      console.log(chalk.cyan('Browser:'), options.browser);
      console.log(chalk.cyan('Server:'), config.serverUrl);
      
      console.log(chalk.gray('\nThe browser is now controlled by xtest.ing'));
      console.log(chalk.gray('Press Ctrl+C to stop the session\n'));

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\nStopping browser session...'));
        await controller.stop();
        process.exit(0);
      });

      // Keep the process running
      await new Promise(() => {});
      
    } catch (error: any) {
      spinner.fail('Failed to start browser session');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Add subcommand to list available browser types
browserCommand
  .command('list')
  .description('List available browser types')
  .action(() => {
    console.log(chalk.cyan('\nAvailable browsers:'));
    console.log('  • chromium (default)');
    console.log('  • firefox');
    console.log('  • webkit (Safari)\n');
    
    console.log(chalk.cyan('Available modes:'));
    console.log('  • inspector - Browser with DevTools (default)');
    console.log('  • headed - Normal browser window');
    console.log('  • headless - No visible browser\n');
  }); 