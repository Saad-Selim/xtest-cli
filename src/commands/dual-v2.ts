import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { getConfig } from '../utils/config';
import { chromium, Browser, Page } from 'playwright';

let localBrowser: Browser | null = null;
let localPage: Page | null = null;
let cloudSessionId: string | null = null;
let config: any = null;

async function ensureAuthenticated() {
  config = await getConfig();
  if (!config.apiKey) {
    console.log(chalk.red('❌ Not authenticated. Run: xtest auth'));
    process.exit(1);
  }
}

async function ensureSession() {
  if (!localBrowser || !cloudSessionId) {
    console.log(chalk.red('❌ No active dual browser session. Run: xtest dual2 start'));
    process.exit(1);
  }
}

export const dual2Command = new Command('dual2')
  .description('Control both local and cloud browsers independently (v2)')
  .action(async () => {
    console.log('\n' + chalk.cyan.bold('🎭 Dual Browser Control v2'));
    console.log(chalk.gray('Control local and cloud browsers independently\n'));
    console.log(chalk.yellow('Commands:'));
    console.log(chalk.gray('  xtest dual2 start     - Start both browsers'));
    console.log(chalk.gray('  xtest dual2 local     - Control local browser'));
    console.log(chalk.gray('  xtest dual2 cloud     - Control cloud browser'));
    console.log(chalk.gray('  xtest dual2 both      - Control both browsers'));
    console.log(chalk.gray('  xtest dual2 stop      - Stop both browsers\n'));
  });

// Start command
dual2Command
  .command('start')
  .description('Start both local and cloud browser sessions')
  .action(async () => {
    await ensureAuthenticated();
    
    const spinner = ora('Starting dual browser control...').start();
    
    try {
      // Start local browser
      spinner.text = 'Starting local browser...';
      localBrowser = await chromium.launch({
        headless: false,
        args: ['--start-maximized'],
      });
      const context = await localBrowser.newContext({
        viewport: null,
      });
      localPage = await context.newPage();
      
      // Start cloud browser
      spinner.text = 'Starting cloud browser...';
      const response = await axios.post(
        `${config.serverUrl}/api/enhanced-browser/inspector/create`,
        {
          sessionId: `cloud-dual-${Date.now()}`,
          headless: false,
          devtools: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      
      if (!response.data.success) {
        throw new Error('Failed to create cloud browser');
      }
      
      cloudSessionId = response.data.sessionId;
      
      // Start streaming
      await axios.post(
        `${config.serverUrl}/api/enhanced-browser/start-stream`,
        { sessionId: cloudSessionId },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      
      spinner.succeed('Dual browser control started');
      
      console.log('\n' + chalk.green('✅ Both browsers ready!'));
      console.log(chalk.gray('📍 Local browser: Open on your screen'));
      console.log(chalk.gray(`☁️  Cloud browser: ${cloudSessionId}`));
      console.log(chalk.gray('🎥 Cloud browser streaming to dashboard\n'));
      
      console.log(chalk.yellow('Quick commands:'));
      console.log(chalk.gray('  xtest dual2 local navigate https://example.com'));
      console.log(chalk.gray('  xtest dual2 cloud navigate https://google.com'));
      console.log(chalk.gray('  xtest dual2 both screenshot\n'));
      
    } catch (error: any) {
      spinner.fail('Failed to start dual browser control');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Local browser commands
const localCommand = dual2Command
  .command('local')
  .description('Control local browser');

localCommand
  .command('navigate <url>')
  .description('Navigate local browser to URL')
  .action(async (url) => {
    await ensureSession();
    try {
      console.log(chalk.cyan(`[Local] Navigating to ${url}...`));
      await localPage!.goto(url);
      console.log(chalk.green('✅ Local browser navigated'));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed:'), error.message);
    }
  });

localCommand
  .command('screenshot [filename]')
  .description('Take screenshot of local browser')
  .action(async (filename) => {
    await ensureSession();
    try {
      const path = filename || `local-screenshot-${Date.now()}.png`;
      await localPage!.screenshot({ path });
      console.log(chalk.green(`✅ Screenshot saved: ${path}`));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed:'), error.message);
    }
  });

localCommand
  .command('click <selector>')
  .description('Click element in local browser')
  .action(async (selector) => {
    await ensureSession();
    try {
      await localPage!.click(selector);
      console.log(chalk.green(`✅ Clicked ${selector} in local browser`));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed:'), error.message);
    }
  });

// Cloud browser commands
const cloudCommand = dual2Command
  .command('cloud')
  .description('Control cloud browser');

cloudCommand
  .command('navigate <url>')
  .description('Navigate cloud browser to URL')
  .action(async (url) => {
    await ensureAuthenticated();
    await ensureSession();
    try {
      console.log(chalk.cyan(`[Cloud] Navigating to ${url}...`));
      await axios.post(
        `${config.serverUrl}/api/enhanced-browser/inspector/navigate`,
        { sessionId: cloudSessionId, url },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(chalk.green('✅ Cloud browser navigated'));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed:'), error.message);
    }
  });

cloudCommand
  .command('screenshot [filename]')
  .description('Take screenshot of cloud browser')
  .action(async (_filename) => {
    await ensureAuthenticated();
    await ensureSession();
    try {
      const response = await axios.post(
        `${config.serverUrl}/api/enhanced-browser/inspector/screenshot`,
        { sessionId: cloudSessionId },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(chalk.green('✅ Cloud screenshot taken'));
      if (response.data.screenshot) {
        console.log(chalk.gray(`View at: ${config.serverUrl}${response.data.screenshot}`));
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Failed:'), error.message);
    }
  });

// Both browsers commands
const bothCommand = dual2Command
  .command('both')
  .description('Control both browsers');

bothCommand
  .command('navigate <url>')
  .description('Navigate both browsers to URL')
  .action(async (url) => {
    await ensureAuthenticated();
    await ensureSession();
    
    console.log(chalk.cyan(`Navigating both browsers to ${url}...`));
    
    // Navigate local
    try {
      await localPage!.goto(url);
      console.log(chalk.green('✅ Local browser navigated'));
    } catch (error: any) {
      console.error(chalk.red('❌ Local failed:'), error.message);
    }
    
    // Navigate cloud
    try {
      await axios.post(
        `${config.serverUrl}/api/enhanced-browser/inspector/navigate`,
        { sessionId: cloudSessionId, url },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(chalk.green('✅ Cloud browser navigated'));
    } catch (error: any) {
      console.error(chalk.red('❌ Cloud failed:'), error.message);
    }
  });

bothCommand
  .command('screenshot')
  .description('Take screenshots from both browsers')
  .action(async () => {
    await ensureAuthenticated();
    await ensureSession();
    
    console.log(chalk.cyan('Taking screenshots from both browsers...'));
    
    // Local screenshot
    try {
      const localPath = `local-screenshot-${Date.now()}.png`;
      await localPage!.screenshot({ path: localPath });
      console.log(chalk.green(`✅ Local screenshot: ${localPath}`));
    } catch (error: any) {
      console.error(chalk.red('❌ Local failed:'), error.message);
    }
    
    // Cloud screenshot
    try {
      await axios.post(
        `${config.serverUrl}/api/enhanced-browser/inspector/screenshot`,
        { sessionId: cloudSessionId },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(chalk.green('✅ Cloud screenshot taken'));
    } catch (error: any) {
      console.error(chalk.red('❌ Cloud failed:'), error.message);
    }
  });

// Stop command
dual2Command
  .command('stop')
  .description('Stop both browsers')
  .action(async () => {
    await ensureAuthenticated();
    
    console.log(chalk.yellow('Stopping dual browser control...'));
    
    // Close local browser
    if (localBrowser) {
      try {
        await localBrowser.close();
        console.log(chalk.green('✅ Local browser closed'));
        localBrowser = null;
        localPage = null;
      } catch (error) {
        console.error(chalk.red('Failed to close local browser'));
      }
    }
    
    // Close cloud browser
    if (cloudSessionId) {
      try {
        await axios.delete(
          `${config.serverUrl}/api/enhanced-browser/inspector/${cloudSessionId}`,
          {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
            },
          },
        );
        console.log(chalk.green('✅ Cloud browser closed'));
        cloudSessionId = null;
      } catch (error) {
        console.error(chalk.red('Failed to close cloud browser'));
      }
    }
    
    console.log(chalk.green('\n✅ Dual browser control stopped'));
  });

// Demo command
dual2Command
  .command('demo')
  .description('Run a demo showing independent control')
  .action(async () => {
    console.log(chalk.cyan('\n🎬 Dual Browser Demo\n'));
    
    console.log(chalk.yellow('1. Start both browsers:'));
    console.log(chalk.gray('   xtest dual2 start\n'));
    
    console.log(chalk.yellow('2. Navigate to different sites:'));
    console.log(chalk.gray('   xtest dual2 local navigate https://example.com'));
    console.log(chalk.gray('   xtest dual2 cloud navigate https://google.com\n'));
    
    console.log(chalk.yellow('3. Take screenshots:'));
    console.log(chalk.gray('   xtest dual2 both screenshot\n'));
    
    console.log(chalk.yellow('4. Stop when done:'));
    console.log(chalk.gray('   xtest dual2 stop\n'));
  }); 