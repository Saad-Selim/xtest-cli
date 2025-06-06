import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { getConfig } from '../utils/config';
import Table from 'cli-table3';

export const sessionsCommand = new Command('sessions')
  .description('Manage browser sessions');

// Add list subcommand
sessionsCommand
  .command('list')
  .description('List all active browser sessions')
  .action(async () => {
    const spinner = ora({
      text: 'Fetching sessions...',
      color: 'cyan',
    }).start();
    
    try {
      const config = await getConfig();
      if (!config.apiKey) {
        spinner.fail('Not authenticated');
        console.log(chalk.gray('\nPlease authenticate first:'));
        console.log(chalk.cyan('  xtest auth\n'));
        process.exit(1);
      }

      // Fetch sessions from server
      const response = await axios.get(`${config.serverUrl}/api/enhanced-browser/inspector/sessions`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        timeout: 5000,
      });

      spinner.succeed('Sessions fetched');
      
      const sessions = response.data.sessions || [];

      if (sessions.length === 0) {
        console.log('\n' + chalk.yellow('📋 No active sessions'));
        console.log(chalk.gray('\nStart a new session:'));
        console.log(chalk.cyan('  xtest browser --interactive\n'));
        return;
      }

      // Create table
      const table = new Table({
        head: [
          chalk.cyan('Session ID'),
          chalk.cyan('Mode'),
          chalk.cyan('Browser'),
          chalk.cyan('Created'),
          chalk.cyan('Status'),
        ],
        style: {
          head: [],
          border: ['gray'],
        },
      });

      sessions.forEach((session: any) => {
        const created = new Date(session.created);
        const now = new Date();
        const ageMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
        
        let ageStr = created.toLocaleTimeString();
        if (ageMinutes < 60) {
          ageStr += chalk.gray(` (${ageMinutes}m ago)`);
        } else {
          ageStr += chalk.gray(` (${Math.floor(ageMinutes / 60)}h ago)`);
        }
        
        table.push([
          chalk.yellow(session.id),
          session.mode || 'headed',
          session.browser || 'chromium',
          ageStr,
          chalk.green('● Active'),
        ]);
      });

      console.log('\n' + chalk.cyan.bold('🖥️  Active Browser Sessions'));
      console.log(table.toString());
      console.log('\n' + chalk.gray('To close a session:'));
      console.log(chalk.cyan('  xtest sessions close <session-id>\n'));
    } catch (error: any) {
      spinner.fail('Failed to fetch sessions');
      
      if (error.code === 'ECONNREFUSED') {
        console.error(chalk.red('\n❌ Could not connect to server'));
        console.error(chalk.gray(`   Server: ${error.config?.baseURL || 'unknown'}`));
      } else if (error.response?.status === 401) {
        console.error(chalk.red('\n❌ Authentication failed'));
        console.error(chalk.gray('   Your API key may be invalid'));
      } else {
        console.error(chalk.red('\n❌ Error: ') + error.message);
      }
      process.exit(1);
    }
  });

// Add subcommand to close a session
sessionsCommand
  .command('close <sessionId>')
  .description('Close a browser session')
  .action(async (sessionId: string) => {
    const spinner = ora({
      text: 'Closing session...',
      color: 'yellow',
    }).start();
    
    try {
      const config = await getConfig();
      if (!config.apiKey) {
        spinner.fail('Not authenticated');
        console.log(chalk.gray('\nPlease authenticate first:'));
        console.log(chalk.cyan('  xtest auth\n'));
        process.exit(1);
      }

      await axios.delete(`${config.serverUrl}/api/enhanced-browser/inspector/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        timeout: 5000,
      });

      spinner.succeed(`Session ${sessionId} closed`);
      console.log(chalk.gray('\nSession has been terminated successfully.\n'));
    } catch (error: any) {
      spinner.fail('Failed to close session');
      
      if (error.response?.status === 404) {
        console.error(chalk.red('\n❌ Session not found'));
        console.error(chalk.gray(`   Session ID: ${sessionId}`));
      } else {
        console.error(chalk.red('\n❌ Error: ') + error.message);
      }
      process.exit(1);
    }
  });

// Default action shows help
sessionsCommand.action(() => {
  console.log('\n' + chalk.cyan.bold('📋 Session Management Commands\n'));
  console.log(chalk.white('  List active sessions:'));
  console.log(chalk.cyan('    xtest sessions list\n'));
  console.log(chalk.white('  Close a session:'));
  console.log(chalk.cyan('    xtest sessions close <session-id>\n'));
  console.log(chalk.gray('For more help: ') + chalk.cyan('xtest sessions --help\n'));
}); 