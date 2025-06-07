import { chromium, Browser, Page } from 'playwright';
import * as readline from 'readline';
import axios from 'axios';
import WebSocket from 'ws';
import { Command } from 'commander';
import { getConfig } from '../utils/config';

interface DualBrowserState {
  localBrowser: Browser | null;
  localPage: Page | null;
  cloudSessionId: string | null;
  ws: WebSocket | null;
  apiClient: any;
}

export const dualInteractiveCommand = new Command('interactive')
  .alias('i')
  .description('Interactive dual browser control with persistent state')
  .action(dualInteractive);

export async function dualInteractive() {
  console.log('🚀 Starting interactive dual browser control...\n');

  const config = await getConfig();
  if (!config.apiKey) {
    console.error('❌ Not authenticated. Please run "xtest auth" first.');
    process.exit(1);
  }

  const API_BASE_URL = config.serverUrl;
  const WS_BASE_URL = config.serverUrl.replace('https://', 'wss://').replace('http://', 'ws://');

  const state: DualBrowserState = {
    localBrowser: null,
    localPage: null,
    cloudSessionId: null,
    ws: null,
    apiClient: axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }),
  };

  // Initialize browsers
  try {
    // Launch local browser
    console.log('🖥️  Launching local browser...');
    state.localBrowser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
    });
    const context = await state.localBrowser.newContext({
      viewport: null,
    });
    state.localPage = await context.newPage();
    console.log('✅ Local browser ready');

    // Create cloud session
    console.log('☁️  Creating cloud browser session...');
    state.cloudSessionId = `cloud-interactive-${Date.now()}`;
    await state.apiClient.post('/api/enhanced-browser/create', {
      sessionId: state.cloudSessionId,
      url: 'about:blank',
    });
    console.log('✅ Cloud browser ready');

    // Connect WebSocket for real-time updates
    state.ws = new WebSocket(`${WS_BASE_URL}/ws/cli`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'x-session-id': state.cloudSessionId,
      },
    });

    state.ws.on('open', () => {
      console.log('✅ Connected to cloud control');
    });

    state.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'navigation') {
        console.log(`☁️  Cloud navigated to: ${message.url}`);
      }
    });

    console.log('\n✨ Both browsers ready for independent control!');
    console.log('📍 Local browser: Direct control');
    console.log('☁️  Cloud browser: Remote control');
    console.log('\nAvailable commands:');
    console.log('  local <url>     - Navigate local browser');
    console.log('  cloud <url>     - Navigate cloud browser');
    console.log('  local click <selector> - Click in local browser');
    console.log('  cloud click <selector> - Click in cloud browser');
    console.log('  local type <selector> <text> - Type in local browser');
    console.log('  cloud type <selector> <text> - Type in cloud browser');
    console.log('  status          - Show browser states');
    console.log('  exit            - Close browsers and exit');
    console.log('');

    // Start REPL
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'xtest> ',
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const parts = line.trim().split(' ');
      const command = parts[0];
      
      try {
        switch (command) {
        case 'local':
          await handleLocalCommand(state, parts.slice(1));
          break;
          
        case 'cloud':
          await handleCloudCommand(state, parts.slice(1));
          break;
          
        case 'status':
          await showStatus(state);
          break;
          
        case 'exit':
          await cleanup(state);
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log('Unknown command. Type "help" for available commands.');
        }
      } catch (error: any) {
        console.error('Error:', error.message || error);
      }
      
      rl.prompt();
    });

    rl.on('close', async () => {
      await cleanup(state);
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to initialize:', error);
    await cleanup(state);
    process.exit(1);
  }
}

async function handleLocalCommand(state: DualBrowserState, args: string[]) {
  if (!state.localPage) {
    console.error('Local browser not initialized');
    return;
  }

  const action = args[0];
  
  switch (action) {
  case 'goto':
  case 'navigate': {
    const url = args[1];
    if (!url) {
      console.error('Please provide a URL');
      return;
    }
    console.log(`📍 Navigating local browser to: ${url}`);
    await state.localPage.goto(url.startsWith('http') ? url : `https://${url}`);
    console.log('✅ Local navigation complete');
    break;
  }
    
  case 'click': {
    const clickSelector = args[1];
    if (!clickSelector) {
      console.error('Please provide a selector');
      return;
    }
    await state.localPage.click(clickSelector);
    console.log(`✅ Clicked ${clickSelector} in local browser`);
    break;
  }
    
  case 'type': {
    const typeSelector = args[1];
    const text = args.slice(2).join(' ');
    if (!typeSelector || !text) {
      console.error('Please provide selector and text');
      return;
    }
    await state.localPage.fill(typeSelector, text);
    console.log(`✅ Typed in ${typeSelector} in local browser`);
    break;
  }
    
  default: {
    // If no action specified, treat it as navigation
    if (args[0]) {
      const url = args[0];
      console.log(`📍 Navigating local browser to: ${url}`);
      await state.localPage.goto(url.startsWith('http') ? url : `https://${url}`);
      console.log('✅ Local navigation complete');
    }
  }
  }
}

async function handleCloudCommand(state: DualBrowserState, args: string[]) {
  if (!state.cloudSessionId) {
    console.error('Cloud browser not initialized');
    return;
  }

  const action = args[0];
  
  switch (action) {
  case 'goto':
  case 'navigate': {
    const url = args[1];
    if (!url) {
      console.error('Please provide a URL');
      return;
    }
    console.log(`☁️  Navigating cloud browser to: ${url}`);
    await state.apiClient.post('/api/enhanced-browser/navigate', {
      sessionId: state.cloudSessionId,
      url: url.startsWith('http') ? url : `https://${url}`,
    });
    console.log('✅ Cloud navigation complete');
    break;
  }
    
  case 'click': {
    const clickSelector = args[1];
    if (!clickSelector) {
      console.error('Please provide a selector');
      return;
    }
    await state.apiClient.post('/api/enhanced-browser/click', {
      sessionId: state.cloudSessionId,
      selector: clickSelector,
    });
    console.log(`✅ Clicked ${clickSelector} in cloud browser`);
    break;
  }
    
  case 'type': {
    const typeSelector = args[1];
    const text = args.slice(2).join(' ');
    if (!typeSelector || !text) {
      console.error('Please provide selector and text');
      return;
    }
    await state.apiClient.post('/api/enhanced-browser/type', {
      sessionId: state.cloudSessionId,
      selector: typeSelector,
      text: text,
    });
    console.log(`✅ Typed in ${typeSelector} in cloud browser`);
    break;
  }
    
  default: {
    // If no action specified, treat it as navigation
    if (args[0]) {
      const url = args[0];
      console.log(`☁️  Navigating cloud browser to: ${url}`);
      await state.apiClient.post('/api/enhanced-browser/navigate', {
        sessionId: state.cloudSessionId,
        url: url.startsWith('http') ? url : `https://${url}`,
      });
      console.log('✅ Cloud navigation complete');
    }
  }
  }
}

async function showStatus(state: DualBrowserState) {
  console.log('\n📊 Browser Status:');
  
  if (state.localPage) {
    const localUrl = state.localPage.url();
    console.log(`📍 Local browser: ${localUrl}`);
  } else {
    console.log('📍 Local browser: Not initialized');
  }
  
  if (state.cloudSessionId) {
    try {
      const response = await state.apiClient.get(`/api/enhanced-browser/session/${state.cloudSessionId}`);
      console.log(`☁️  Cloud browser: ${response.data.url || 'about:blank'}`);
    } catch (error) {
      console.log(`☁️  Cloud browser: Session ${state.cloudSessionId} (status unknown)`);
    }
  } else {
    console.log('☁️  Cloud browser: Not initialized');
  }
  
  console.log('');
}

async function cleanup(state: DualBrowserState) {
  console.log('\n🧹 Cleaning up...');
  
  if (state.ws) {
    state.ws.close();
  }
  
  if (state.localBrowser) {
    await state.localBrowser.close();
  }
  
  if (state.cloudSessionId) {
    try {
      await state.apiClient.post('/api/enhanced-browser/close', {
        sessionId: state.cloudSessionId,
      });
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
  
  console.log('✅ Cleanup complete');
} 