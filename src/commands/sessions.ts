import { Command } from 'commander';
import chalk from 'chalk';
import axios from 'axios';
import { getConfig } from '../utils/config';
import Table from 'cli-table3';

export const sessionsCommand = new Command('sessions')
  .description('Manage browser sessions')
  .action(async () => {
    try {
      const config = await getConfig();
      if (!config.apiKey) {
        console.log(chalk.yellow('Please run "xtest auth" first'));
        process.exit(1);
      }

      // Fetch sessions from server
      const response = await axios.get(`${config.serverUrl}/api/enhanced-browser/inspector/sessions`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      const sessions = response.data.sessions || [];

      if (sessions.length === 0) {
        console.log(chalk.gray('No active sessions'));
        return;
      }

      // Create table
      const table = new Table({
        head: ['Session ID', 'Mode', 'Created', 'Status'],
        colWidths: [30, 15, 25, 10],
      });

      sessions.forEach((session: any) => {
        table.push([
          session.id,
          session.mode,
          new Date(session.created).toLocaleString(),
          chalk.green('Active'),
        ]);
      });

      console.log(chalk.cyan('\nActive Sessions:'));
      console.log(table.toString());
    } catch (error: any) {
      console.error(chalk.red('Failed to fetch sessions:'), error.message);
      process.exit(1);
    }
  });

// Add subcommand to close a session
sessionsCommand
  .command('close <sessionId>')
  .description('Close a browser session')
  .action(async (sessionId: string) => {
    try {
      const config = await getConfig();
      if (!config.apiKey) {
        console.log(chalk.yellow('Please run "xtest auth" first'));
        process.exit(1);
      }

      await axios.delete(`${config.serverUrl}/api/enhanced-browser/inspector/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      console.log(chalk.green(`✅ Session ${sessionId} closed`));
    } catch (error: any) {
      console.error(chalk.red('Failed to close session:'), error.message);
      process.exit(1);
    }
  }); 