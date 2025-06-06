import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { saveConfig, getConfig } from '../utils/config';
import axios from 'axios';

// Welcome banner
const showWelcomeBanner = () => {
  console.log('\n' + chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan.bold('  Welcome to xtest CLI - Browser Automation Made Simple'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
};

// Helper to mask API key
const maskApiKey = (key: string): string => {
  if (key.length <= 8) return '•'.repeat(key.length);
  return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
};

export const authCommand = new Command('auth')
  .description('Authenticate with xtest.ing')
  .option('-k, --key <apiKey>', 'API key for authentication')
  .option('-u, --url <url>', 'xtest.ing server URL', 'https://xtest.ing')
  .action(async (options) => {
    try {
      showWelcomeBanner();
      
      let apiKey = options.key;
      let serverUrl = options.url;

      // Check if already authenticated
      const existingConfig = await getConfig();
      if (existingConfig.apiKey && !apiKey) {
        console.log(chalk.yellow('📌 You are already authenticated'));
        console.log(chalk.gray(`   Server: ${existingConfig.serverUrl}`));
        console.log(chalk.gray(`   API Key: ${maskApiKey(existingConfig.apiKey)}`));
        
        const { continueAuth } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAuth',
            message: 'Do you want to update your credentials?',
            default: false,
          },
        ]);
        
        if (!continueAuth) {
          console.log(chalk.gray('\n👍 Using existing credentials'));
          return;
        }
      }

      // If no API key provided, show interactive prompts
      if (!apiKey) {
        console.log(chalk.white.bold('🔐 Authentication Setup\n'));
        console.log(chalk.gray('  To get your API key:'));
        console.log(chalk.gray('  1. Visit https://xtest.ing/dashboard'));
        console.log(chalk.gray('  2. Go to Settings → API Keys'));
        console.log(chalk.gray('  3. Create or copy your API key\n'));

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'serverUrl',
            message: '🌐 Server URL:',
            default: serverUrl,
            prefix: chalk.cyan('  '),
            validate: (input) => {
              if (!input) return 'Server URL is required';
              if (!input.startsWith('http://') && !input.startsWith('https://')) {
                return 'Server URL must start with http:// or https://';
              }
              return true;
            },
          },
          {
            type: 'password',
            name: 'apiKey',
            message: '🔑 API Key:',
            prefix: chalk.cyan('  '),
            mask: '•',
            validate: (input) => {
              if (!input) return 'API key is required';
              if (input.length < 10) return 'API key seems too short';
              return true;
            },
          },
        ]);
        apiKey = answers.apiKey;
        serverUrl = answers.serverUrl;
      }

      // Validate the API key with spinner
      const spinner = ora({
        text: 'Validating credentials...',
        color: 'cyan',
      }).start();
      
      try {
        const response = await axios.get(`${serverUrl}/api/health`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 10000,
        });

        if (response.status === 200) {
          spinner.succeed(chalk.green('Authentication successful!'));
          
          // Save the configuration
          await saveConfig({ apiKey, serverUrl });
          
          // Show success message with next steps
          console.log('\n' + chalk.green.bold('✨ You\'re all set!'));
          console.log(chalk.white('\n📋 Next steps:'));
          console.log(chalk.gray('  • Start a browser session: ') + chalk.cyan('xtest browser --mode headed'));
          console.log(chalk.gray('  • View your sessions: ') + chalk.cyan('xtest sessions list'));
          console.log(chalk.gray('  • Check auth status: ') + chalk.cyan('xtest auth status'));
          console.log('\n' + chalk.gray('Connected to: ') + chalk.cyan(serverUrl));
        }
      } catch (error: any) {
        spinner.fail(chalk.red('Authentication failed'));
        
        if (error.response?.status === 401) {
          console.error(chalk.red('\n❌ Invalid API key'));
          console.error(chalk.gray('   Please check your API key and try again'));
        } else if (error.code === 'ECONNREFUSED') {
          console.error(chalk.red('\n❌ Could not connect to server'));
          console.error(chalk.gray(`   Server: ${serverUrl}`));
          console.error(chalk.gray('   Please check if the server is running and accessible'));
        } else if (error.code === 'ETIMEDOUT') {
          console.error(chalk.red('\n❌ Connection timeout'));
          console.error(chalk.gray('   The server took too long to respond'));
        } else {
          console.error(chalk.red('\n❌ Connection failed'));
          console.error(chalk.gray(`   ${error.message}`));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    }
  });

// Add logout subcommand
authCommand
  .command('logout')
  .description('Remove stored credentials')
  .action(async () => {
    try {
      const config = await getConfig();
      if (!config.apiKey) {
        console.log(chalk.yellow('⚠️  You are not logged in'));
        return;
      }

      const { confirmLogout } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmLogout',
          message: 'Are you sure you want to logout?',
          default: false,
        },
      ]);

      if (confirmLogout) {
        await saveConfig({ apiKey: '', serverUrl: '' });
        console.log(chalk.green('✅ Logged out successfully'));
      } else {
        console.log(chalk.gray('Logout cancelled'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to logout:'), error);
    }
  });

// Add status subcommand
authCommand
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    try {
      const config = await getConfig();
      
      console.log('\n' + chalk.cyan('═'.repeat(50)));
      console.log(chalk.cyan.bold('  Authentication Status'));
      console.log(chalk.cyan('═'.repeat(50)) + '\n');
      
      if (config.apiKey) {
        const spinner = ora({
          text: 'Checking connection...',
          color: 'cyan',
        }).start();

        try {
          const response = await axios.get(`${config.serverUrl}/api/health`, {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
            },
            timeout: 5000,
          });

          if (response.status === 200) {
            spinner.succeed(chalk.green('Connected'));
            console.log('\n' + chalk.green('✅ Authenticated'));
            console.log(chalk.white('   Server: ') + chalk.cyan(config.serverUrl));
            console.log(chalk.white('   API Key: ') + chalk.gray(maskApiKey(config.apiKey)));
            console.log(chalk.white('   Status: ') + chalk.green('Active'));
          }
        } catch (error) {
          spinner.fail(chalk.red('Connection failed'));
          console.log('\n' + chalk.yellow('⚠️  Authenticated but cannot reach server'));
          console.log(chalk.white('   Server: ') + chalk.cyan(config.serverUrl));
          console.log(chalk.white('   API Key: ') + chalk.gray(maskApiKey(config.apiKey)));
          console.log(chalk.white('   Status: ') + chalk.red('Offline'));
        }
      } else {
        console.log(chalk.yellow('⚠️  Not authenticated'));
        console.log(chalk.gray('\n   To authenticate, run:'));
        console.log(chalk.cyan('   xtest auth'));
      }
      
      console.log('\n' + chalk.cyan('═'.repeat(50)) + '\n');
    } catch (error) {
      console.error(chalk.red('❌ Failed to check status:'), error);
    }
  }); 