import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { DualBrowserController, BrowserTarget } from '../browser/dual-controller';
import { getConfig } from '../utils/config';

let controller: DualBrowserController | null = null;

export const dualCommand = new Command('dual')
  .description('Control both local and cloud browsers independently')
  .action(async () => {
    console.log('\n' + chalk.cyan.bold('🎭 Dual Browser Control Mode'));
    console.log(chalk.gray('Control local and cloud browsers independently\n'));
  });

// Start dual browser session
dualCommand
  .command('start')
  .description('Start both local and cloud browser sessions')
  .option('-s, --session <id>', 'Session ID', `dual-${Date.now()}`)
  .option('-b, --browser <type>', 'Local browser type', 'chromium')
  .option('--headless', 'Run local browser in headless mode', false)
  .action(async (options) => {
    try {
      const config = await getConfig();
      if (!config.apiKey) {
        console.log(chalk.red('❌ Not authenticated. Run: xtest auth'));
        process.exit(1);
      }

      const spinner = ora('Starting dual browser control...').start();

      controller = new DualBrowserController({
        sessionId: options.session,
        serverUrl: config.serverUrl,
        apiKey: config.apiKey,
        localBrowserOptions: {
          browserType: options.browser,
          headless: options.headless,
          devtools: false,
          slowMo: 100,
        },
      });

      await controller.start();
      spinner.succeed('Dual browser control started');

      console.log('\n' + chalk.green('✨ Ready for commands!'));
      console.log(chalk.gray('Use "xtest dual <command>" to control browsers\n'));

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n' + chalk.yellow('Shutting down...'));
        if (controller) {
          await controller.stop();
        }
        process.exit(0);
      });

    } catch (error: any) {
      console.error(chalk.red('❌ Failed to start:'), error.message);
      process.exit(1);
    }
  });

// Navigate command
dualCommand
  .command('navigate <url>')
  .description('Navigate browser(s) to a URL')
  .option('-t, --target <target>', 'Target browser: local, cloud, or both', 'both')
  .action(async (url, options) => {
    if (!controller) {
      console.log(chalk.red('❌ No active session. Run: xtest dual start'));
      return;
    }

    try {
      const target: BrowserTarget = { type: options.target };
      await controller.navigate(target, url);
      console.log(chalk.green(`✅ Navigated ${options.target} browser(s) to ${url}`));
    } catch (error: any) {
      console.error(chalk.red('❌ Navigation failed:'), error.message);
    }
  });

// Click command
dualCommand
  .command('click <selector>')
  .description('Click an element in browser(s)')
  .option('-t, --target <target>', 'Target browser: local, cloud, or both', 'both')
  .action(async (selector, options) => {
    if (!controller) {
      console.log(chalk.red('❌ No active session. Run: xtest dual start'));
      return;
    }

    try {
      const target: BrowserTarget = { type: options.target };
      await controller.click(target, selector);
      console.log(chalk.green(`✅ Clicked ${selector} in ${options.target} browser(s)`));
    } catch (error: any) {
      console.error(chalk.red('❌ Click failed:'), error.message);
    }
  });

// Type command
dualCommand
  .command('type <selector> <text>')
  .description('Type text in an input field')
  .option('-t, --target <target>', 'Target browser: local, cloud, or both', 'both')
  .action(async (selector, text, options) => {
    if (!controller) {
      console.log(chalk.red('❌ No active session. Run: xtest dual start'));
      return;
    }

    try {
      const target: BrowserTarget = { type: options.target };
      await controller.type(target, selector, text);
      console.log(chalk.green(`✅ Typed in ${selector} in ${options.target} browser(s)`));
    } catch (error: any) {
      console.error(chalk.red('❌ Type failed:'), error.message);
    }
  });

// Screenshot command
dualCommand
  .command('screenshot [filename]')
  .description('Take screenshot(s)')
  .option('-t, --target <target>', 'Target browser: local, cloud, or both', 'both')
  .action(async (filename, options) => {
    if (!controller) {
      console.log(chalk.red('❌ No active session. Run: xtest dual start'));
      return;
    }

    try {
      const target: BrowserTarget = { type: options.target };
      await controller.screenshot(target, filename);
      console.log(chalk.green(`✅ Screenshot(s) saved from ${options.target} browser(s)`));
    } catch (error: any) {
      console.error(chalk.red('❌ Screenshot failed:'), error.message);
    }
  });

// Info command
dualCommand
  .command('info')
  .description('Get page info from browser(s)')
  .option('-t, --target <target>', 'Target browser: local, cloud, or both', 'both')
  .action(async (options) => {
    if (!controller) {
      console.log(chalk.red('❌ No active session. Run: xtest dual start'));
      return;
    }

    try {
      const target: BrowserTarget = { type: options.target };
      const info = await controller.getPageInfo(target);
      
      if (info.local) {
        console.log(chalk.cyan('\n📍 Local Browser:'));
        console.log(chalk.gray(`  URL: ${info.local.url}`));
        console.log(chalk.gray(`  Title: ${info.local.title}`));
      }
      
      if (info.cloud) {
        console.log(chalk.cyan('\n☁️  Cloud Browser:'));
        console.log(chalk.gray(`  URL: ${info.cloud.url}`));
        console.log(chalk.gray(`  Title: ${info.cloud.title}`));
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Info failed:'), error.message);
    }
  });

// Demo command
dualCommand
  .command('demo')
  .description('Run a demo showing independent control')
  .action(async () => {
    if (!controller) {
      console.log(chalk.red('❌ No active session. Run: xtest dual start'));
      return;
    }

    console.log(chalk.cyan('\n🎬 Running Dual Browser Demo...\n'));

    try {
      // Navigate to different sites
      console.log(chalk.yellow('1. Opening different websites...'));
      await controller.navigate({ type: 'local' }, 'https://example.com');
      await controller.navigate({ type: 'cloud' }, 'https://google.com');
      console.log(chalk.green('✅ Local: example.com | Cloud: google.com'));

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take screenshots
      console.log(chalk.yellow('\n2. Taking screenshots...'));
      await controller.screenshot({ type: 'both' }, 'demo.png');
      console.log(chalk.green('✅ Screenshots saved'));

      // Get info
      console.log(chalk.yellow('\n3. Getting page info...'));
      await controller.getPageInfo({ type: 'both' });
      console.log(chalk.green('✅ Page info retrieved'));

      console.log(chalk.cyan('\n✨ Demo complete! Both browsers are independently controlled.'));
      
    } catch (error: any) {
      console.error(chalk.red('❌ Demo failed:'), error.message);
    }
  });

// Examples
dualCommand
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.cyan('\n📚 Dual Browser Control Examples:\n'));
    
    console.log(chalk.white('Start dual browser session:'));
    console.log(chalk.gray('  xtest dual start\n'));
    
    console.log(chalk.white('Navigate both browsers:'));
    console.log(chalk.gray('  xtest dual navigate https://example.com\n'));
    
    console.log(chalk.white('Navigate only local browser:'));
    console.log(chalk.gray('  xtest dual navigate https://example.com --target local\n'));
    
    console.log(chalk.white('Navigate only cloud browser:'));
    console.log(chalk.gray('  xtest dual navigate https://google.com --target cloud\n'));
    
    console.log(chalk.white('Click in both browsers:'));
    console.log(chalk.gray('  xtest dual click "button.submit"\n'));
    
    console.log(chalk.white('Type in cloud browser only:'));
    console.log(chalk.gray('  xtest dual type "input[name=search]" "test query" --target cloud\n'));
    
    console.log(chalk.white('Take screenshots from both:'));
    console.log(chalk.gray('  xtest dual screenshot\n'));
    
    console.log(chalk.white('Run the demo:'));
    console.log(chalk.gray('  xtest dual demo\n'));
  }); 