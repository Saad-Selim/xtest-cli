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

// Helper to mask sensitive data
const maskToken = (token: string): string => {
  if (token.length <= 20) return '•'.repeat(token.length);
  return token.substring(0, 10) + '•'.repeat(20) + '...' + token.substring(token.length - 10);
};

export const authCommand = new Command('auth')
  .description('Login to xtest.ing with your account')
  .option('-e, --email <email>', 'Your account email')
  .option('-p, --password <password>', 'Your account password')
  .option('-u, --url <url>', 'xtest.ing server URL', 'https://xtest.ing')
  .action(async (options) => {
    try {
      showWelcomeBanner();
      
      let email = options.email;
      let password = options.password;
      let serverUrl = options.url;

      // Check if already authenticated
      const existingConfig = await getConfig();
      if (existingConfig.apiKey) {
        console.log(chalk.yellow('📌 You are already logged in'));
        console.log(chalk.gray(`   Server: ${existingConfig.serverUrl}`));
        console.log(chalk.gray(`   Token: ${maskToken(existingConfig.apiKey)}`));
        
        const { continueAuth } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAuth',
            message: 'Do you want to login with different credentials?',
            default: false,
          },
        ]);
        
        if (!continueAuth) {
          console.log(chalk.gray('\n👍 Using existing session'));
          return;
        }
      }

      // If no credentials provided, show interactive prompts
      if (!email || !password) {
        console.log(chalk.white.bold('🔐 Login to xtest.ing\n'));
        console.log(chalk.gray('  Note: You need an active subscription to use the CLI'));
        console.log(chalk.gray('  Sign up at: https://xtest.ing/pricing\n'));

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
            type: 'input',
            name: 'email',
            message: '📧 Email:',
            prefix: chalk.cyan('  '),
            validate: (input) => {
              if (!input) return 'Email is required';
              if (!input.includes('@')) return 'Please enter a valid email';
              return true;
            },
          },
          {
            type: 'password',
            name: 'password',
            message: '🔑 Password:',
            prefix: chalk.cyan('  '),
            mask: '•',
            validate: (input) => {
              if (!input) return 'Password is required';
              return true;
            },
          },
        ]);
        email = answers.email;
        password = answers.password;
        serverUrl = answers.serverUrl;
      }

      // Login with spinner
      const spinner = ora({
        text: 'Logging in...',
        color: 'cyan',
      }).start();
      
      try {
        // First, login to get JWT token
        const loginResponse = await axios.post(`${serverUrl}/api/auth/login`, {
          email,
          password,
        }, {
          timeout: 10000,
        });

        if (loginResponse.status === 200 && loginResponse.data.token) {
          const { token, user } = loginResponse.data;
          
          // Check subscription status
          if (!user.hasActiveSubscription) {
            spinner.fail(chalk.red('No active subscription'));
            console.error(chalk.red('\n❌ Subscription required'));
            console.error(chalk.gray('   You need an active subscription to use the CLI'));
            console.error(chalk.gray('   Visit https://xtest.ing/pricing to subscribe'));
            process.exit(1);
          }
          
          spinner.succeed(chalk.green('Login successful!'));
          
          // Save the token as "apiKey" for backward compatibility
          await saveConfig({ apiKey: token, serverUrl });
          
          // Show success message with user info
          console.log('\n' + chalk.green.bold('✨ Welcome back, ' + (user.name || user.email) + '!'));
          console.log(chalk.gray('   Subscription: ') + chalk.green('Active'));
          console.log(chalk.white('\n📋 Next steps:'));
          console.log(chalk.gray('  • Start a browser session: ') + chalk.cyan('xtest browser --mode headed'));
          console.log(chalk.gray('  • View your sessions: ') + chalk.cyan('xtest sessions list'));
          console.log(chalk.gray('  • Check login status: ') + chalk.cyan('xtest auth status'));
          console.log('\n' + chalk.gray('Connected to: ') + chalk.cyan(serverUrl));
        }
      } catch (error: any) {
        spinner.fail(chalk.red('Login failed'));
        
        if (error.response?.status === 401) {
          console.error(chalk.red('\n❌ Invalid email or password'));
          console.error(chalk.gray('   Please check your credentials and try again'));
        } else if (error.response?.status === 403) {
          console.error(chalk.red('\n❌ Account disabled'));
          console.error(chalk.gray('   Please contact support'));
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
            console.log(chalk.white('   Token: ') + chalk.gray(maskToken(config.apiKey)));
            console.log(chalk.white('   Status: ') + chalk.green('Active'));
          }
        } catch (error) {
          spinner.fail(chalk.red('Connection failed'));
          console.log('\n' + chalk.yellow('⚠️  Authenticated but cannot reach server'));
          console.log(chalk.white('   Server: ') + chalk.cyan(config.serverUrl));
          console.log(chalk.white('   Token: ') + chalk.gray(maskToken(config.apiKey)));
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