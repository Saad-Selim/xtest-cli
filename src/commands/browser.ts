import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BrowserController } from '../browser/controller';
import { getConfig } from '../utils/config';

// Browser type icons
const browserIcons: Record<string, string> = {
  chromium: '🌐',
  firefox: '🦊',
  webkit: '🧭',
};

// Mode descriptions
const modeDescriptions: Record<string, string> = {
  inspector: 'Browser with DevTools for debugging',
  headed: 'Normal browser window',
  headless: 'No visible browser (background mode)',
};

export const browserCommand = new Command('browser')
  .description('Control browser sessions locally')
  .option('-s, --session <id>', 'Session ID to connect to')
  .option('-m, --mode <mode>', 'Browser mode: inspector, headed, headless', 'headed')
  .option('-b, --browser <type>', 'Browser type: chromium, firefox, webkit', 'chromium')
  .option('--devtools', 'Open DevTools automatically', true)
  .option('--slow-mo <ms>', 'Slow down actions by specified milliseconds', '100')
  .option('--record', 'Record the session locally')
  .option('-i, --interactive', 'Interactive mode to select options')
  .action(async (options) => {
    try {
      // Get authentication config
      const config = await getConfig();
      if (!config.apiKey) {
        console.log('\n' + chalk.yellow('⚠️  Not authenticated'));
        console.log(chalk.gray('   Please authenticate first:\n'));
        console.log(chalk.cyan('   xtest auth\n'));
        process.exit(1);
      }

      let browserOptions = {
        mode: options.mode,
        browserType: options.browser,
        devtools: options.devtools && options.mode !== 'headless',
        slowMo: parseInt(options.slowMo),
        record: options.record,
      };

      // Interactive mode
      if (options.interactive && !options.session) {
        console.log('\n' + chalk.cyan.bold('🚀 Browser Session Setup\n'));
        
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'browserType',
            message: 'Select browser:',
            choices: [
              { name: `${browserIcons.chromium} Chromium (Recommended)`, value: 'chromium' },
              { name: `${browserIcons.firefox} Firefox`, value: 'firefox' },
              { name: `${browserIcons.webkit} WebKit (Safari)`, value: 'webkit' },
            ],
            default: 'chromium',
          },
          {
            type: 'list',
            name: 'mode',
            message: 'Select mode:',
            choices: [
              { name: '👁️  Headed - Normal browser window', value: 'headed' },
              { name: '🔍 Inspector - Browser with DevTools', value: 'inspector' },
              { name: '👻 Headless - Background mode', value: 'headless' },
            ],
            default: 'headed',
          },
          {
            type: 'confirm',
            name: 'record',
            message: 'Record the session?',
            default: false,
            when: (answers) => answers.mode !== 'headless',
          },
          {
            type: 'list',
            name: 'slowMo',
            message: 'Action speed:',
            choices: [
              { name: '⚡ Fast (no delay)', value: '0' },
              { name: '🚶 Normal (100ms delay)', value: '100' },
              { name: '🐌 Slow (500ms delay)', value: '500' },
              { name: '🐢 Very slow (1000ms delay)', value: '1000' },
            ],
            default: '100',
          },
        ]);

        browserOptions = {
          ...browserOptions,
          ...answers,
          slowMo: parseInt(answers.slowMo),
          devtools: answers.mode === 'inspector',
        };
      }

      // Generate session ID if not provided
      const sessionId = options.session || `cli-${Date.now()}`;
      
      // Show session preview
      console.log('\n' + chalk.cyan('═'.repeat(60)));
      console.log(chalk.cyan.bold('  Browser Session Configuration'));
      console.log(chalk.cyan('═'.repeat(60)) + '\n');
      console.log(chalk.white('  Session ID: ') + chalk.yellow(sessionId));
      console.log(chalk.white('  Browser: ') + chalk.cyan(`${browserIcons[browserOptions.browserType]} ${browserOptions.browserType}`));
      console.log(chalk.white('  Mode: ') + chalk.cyan(browserOptions.mode) + chalk.gray(` - ${modeDescriptions[browserOptions.mode]}`));
      console.log(chalk.white('  Server: ') + chalk.cyan(config.serverUrl));
      if (browserOptions.record) {
        console.log(chalk.white('  Recording: ') + chalk.green('Enabled'));
      }
      if (browserOptions.slowMo > 0) {
        console.log(chalk.white('  Action delay: ') + chalk.yellow(`${browserOptions.slowMo}ms`));
      }
      console.log('\n' + chalk.cyan('═'.repeat(60)) + '\n');

      const spinner = ora({
        text: 'Initializing browser session...',
        color: 'cyan',
      }).start();
      
      spinner.text = `Launching ${browserOptions.browserType} browser...`;
      
      // Create browser controller
      const controller = new BrowserController({
        sessionId,
        serverUrl: config.serverUrl,
        apiKey: config.apiKey,
        browserOptions,
      });

      // Update spinner during connection
      controller.on('connecting', () => {
        spinner.text = 'Connecting to server...';
      });

      controller.on('connected', () => {
        spinner.text = 'Establishing control...';
      });

      // Start the browser session
      await controller.start();
      
      spinner.succeed('Browser session started');
      
      console.log('\n' + chalk.green.bold('✨ Browser Session Active!'));
      console.log(chalk.gray('\n📌 Session Controls:'));
      console.log(chalk.gray('  • The browser is now controlled by xtest.ing'));
      console.log(chalk.gray('  • You can interact with the browser manually'));
      console.log(chalk.gray('  • Press ') + chalk.yellow('Ctrl+C') + chalk.gray(' to stop the session'));
      
      if (browserOptions.mode === 'inspector') {
        console.log(chalk.gray('\n🔍 DevTools Tips:'));
        console.log(chalk.gray('  • Use the Elements panel to inspect the page'));
        console.log(chalk.gray('  • Check the Console for JavaScript logs'));
        console.log(chalk.gray('  • Use the Network tab to monitor requests'));
      }

      if (browserOptions.record) {
        console.log(chalk.gray('\n🎥 Recording:'));
        console.log(chalk.gray('  • Session is being recorded'));
        console.log(chalk.gray('  • Video will be saved when session ends'));
      }

      console.log('\n' + chalk.cyan('═'.repeat(60)) + '\n');

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n');
        const shutdownSpinner = ora({
          text: 'Stopping browser session...',
          color: 'yellow',
        }).start();
        
        await controller.stop();
        
        shutdownSpinner.succeed('Browser session closed');
        
        if (browserOptions.record) {
          console.log(chalk.green('✅ Recording saved'));
        }
        
        console.log(chalk.gray('\nThank you for using xtest CLI!\n'));
        process.exit(0);
      });

      // Keep the process running
      await new Promise(() => {});
      
    } catch (error: any) {
      console.error('\n' + chalk.red('❌ Failed to start browser session'));
      console.error(chalk.gray(`   ${error.message}`));
      
      if (error.message.includes('ECONNREFUSED')) {
        console.error(chalk.yellow('\n💡 Tip: Make sure the xtest server is running'));
      }
      
      process.exit(1);
    }
  });

// Add subcommand to list available browser types
browserCommand
  .command('list')
  .description('List available browser types and modes')
  .action(() => {
    console.log('\n' + chalk.cyan.bold('🌐 Available Browsers:'));
    console.log(chalk.white('\n  Chromium ') + chalk.gray('(Recommended)'));
    console.log(chalk.gray('  • Fast and reliable'));
    console.log(chalk.gray('  • Best DevTools support'));
    console.log(chalk.gray('  • Works on all platforms'));
    
    console.log(chalk.white('\n  Firefox'));
    console.log(chalk.gray('  • Good for testing Firefox-specific features'));
    console.log(chalk.gray('  • Different rendering engine'));
    
    console.log(chalk.white('\n  WebKit ') + chalk.gray('(Safari)'));
    console.log(chalk.gray('  • Test Safari compatibility'));
    console.log(chalk.gray('  • macOS and iOS behavior'));
    
    console.log('\n' + chalk.cyan.bold('📋 Available Modes:'));
    console.log(chalk.white('\n  headed ') + chalk.gray('(Default)'));
    console.log(chalk.gray('  • See the browser window'));
    console.log(chalk.gray('  • Interact manually if needed'));
    
    console.log(chalk.white('\n  inspector'));
    console.log(chalk.gray('  • Browser with DevTools open'));
    console.log(chalk.gray('  • Perfect for debugging'));
    
    console.log(chalk.white('\n  headless'));
    console.log(chalk.gray('  • No visible browser'));
    console.log(chalk.gray('  • Runs in background'));
    console.log(chalk.gray('  • Good for CI/CD'));
    
    console.log('\n' + chalk.cyan.bold('💡 Examples:'));
    console.log(chalk.gray('\n  Start with interactive setup:'));
    console.log(chalk.cyan('  xtest browser --interactive'));
    
    console.log(chalk.gray('\n  Quick start with defaults:'));
    console.log(chalk.cyan('  xtest browser'));
    
    console.log(chalk.gray('\n  Debug mode with Firefox:'));
    console.log(chalk.cyan('  xtest browser --mode inspector --browser firefox'));
    
    console.log(chalk.gray('\n  Headless with recording:'));
    console.log(chalk.cyan('  xtest browser --mode headless --record\n'));
  }); 