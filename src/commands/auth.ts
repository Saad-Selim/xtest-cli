import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { saveConfig, getConfig } from '../utils/config';
import axios from 'axios';

export const authCommand = new Command('auth')
  .description('Authenticate with xtest.ing')
  .option('-k, --key <apiKey>', 'API key for authentication')
  .option('-u, --url <url>', 'xtest.ing server URL', 'https://xtest.ing')
  .action(async (options) => {
    try {
      let apiKey = options.key;
      let serverUrl = options.url;

      // If no API key provided, prompt for it
      if (!apiKey) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'serverUrl',
            message: 'xtest.ing server URL:',
            default: serverUrl,
          },
          {
            type: 'password',
            name: 'apiKey',
            message: 'Enter your API key:',
            validate: (input) => input.length > 0 || 'API key is required',
          },
        ]);
        apiKey = answers.apiKey;
        serverUrl = answers.serverUrl;
      }

      // Validate the API key
      console.log(chalk.yellow('🔐 Validating credentials...'));
      
      try {
        const response = await axios.get(`${serverUrl}/api/health`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (response.status === 200) {
          // Save the configuration
          await saveConfig({ apiKey, serverUrl });
          console.log(chalk.green('✅ Authentication successful!'));
          console.log(chalk.gray(`Connected to: ${serverUrl}`));
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.error(chalk.red('❌ Invalid API key'));
        } else {
          console.error(chalk.red(`❌ Failed to connect to ${serverUrl}`));
          console.error(chalk.gray(error.message));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Authentication failed:'), error);
      process.exit(1);
    }
  });

// Add logout subcommand
authCommand
  .command('logout')
  .description('Remove stored credentials')
  .action(async () => {
    try {
      await saveConfig({ apiKey: '', serverUrl: '' });
      console.log(chalk.green('✅ Logged out successfully'));
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
      if (config.apiKey) {
        console.log(chalk.green('✅ Authenticated'));
        console.log(chalk.gray(`Server: ${config.serverUrl}`));
        console.log(chalk.gray(`API Key: ${config.apiKey.substring(0, 8)}...`));
      } else {
        console.log(chalk.yellow('⚠️  Not authenticated'));
        console.log(chalk.gray('Run "xtest auth" to authenticate'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to check status:'), error);
    }
  }); 