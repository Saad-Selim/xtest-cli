import { chromium, Browser, Page } from 'playwright';
import axios from 'axios';
import WebSocket from 'ws';
import { Command } from 'commander';
import { getConfig } from '../utils/config';

export const mirrorCommand = new Command('mirror')
  .description('Start synchronized browser control - actions mirror between local and cloud')
  .option('-u, --url <url>', 'Initial URL to navigate to', 'https://google.com')
  .action(mirror);

export async function mirror(options: { url: string }) {
  console.log('🔄 Starting synchronized browser control...\n');

  const config = await getConfig();
  if (!config.apiKey) {
    console.error('❌ Not authenticated. Please run "xtest auth" first.');
    process.exit(1);
  }

  const API_BASE_URL = config.serverUrl;
  const WS_BASE_URL = config.serverUrl.replace('https://', 'wss://').replace('http://', 'ws://');

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  let localBrowser: Browser | null = null;
  let localPage: Page | null = null;
  let cloudSessionId: string | null = null;
  let ws: WebSocket | null = null;
  let isMirroring = false;

  try {
    // Launch local browser
    console.log('🖥️  Launching local browser...');
    localBrowser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
    });
    
    const context = await localBrowser.newContext({
      viewport: null,
    });
    
    localPage = await context.newPage();
    console.log('✅ Local browser ready');

    // Create cloud session
    console.log('☁️  Creating cloud browser session...');
    cloudSessionId = `mirror-${Date.now()}`;
    
    try {
      await apiClient.post('/api/enhanced-browser/create', {
        sessionId: cloudSessionId,
        url: 'about:blank',
      });
      console.log('✅ Cloud browser ready');
    } catch (error: any) {
      console.error('❌ Failed to create cloud session:', error.response?.data || error.message);
      throw error;
    }

    // Connect WebSocket for real-time sync
    ws = new WebSocket(`${WS_BASE_URL}/ws/cli`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Session-ID': cloudSessionId,
        'X-CLI-Version': '0.5.2',
      },
    });

    ws.on('open', () => {
      console.log('✅ Connected to cloud sync');
      console.log('\n🔄 Browsers are now synchronized!');
      console.log('📍 Actions in local browser will be mirrored to cloud browser');
      console.log('🌐 Navigate to any website and interact normally\n');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Navigate both browsers to initial URL
    console.log(`📍 Navigating to: ${options.url}`);
    await localPage.goto(options.url);
    
    // Mirror navigation to cloud
    await apiClient.post('/api/enhanced-browser/navigate', {
      sessionId: cloudSessionId,
      url: options.url,
    });

    // Set up mirroring event listeners
    isMirroring = true;

    // Intercept and mirror navigation
    localPage.on('framenavigated', async (frame) => {
      if (!isMirroring || frame !== localPage?.mainFrame()) return;
      
      const url = frame.url();
      if (url && url !== 'about:blank') {
        console.log(`🔄 Mirroring navigation to: ${url}`);
        try {
          await apiClient.post('/api/enhanced-browser/navigate', {
            sessionId: cloudSessionId,
            url: url,
          });
        } catch (error) {
          console.error('Failed to mirror navigation:', error);
        }
      }
    });

    // Override page methods to intercept actions
    const originalClick = localPage.click.bind(localPage);
    localPage.click = async (selector: string, options?: any) => {
      if (isMirroring) {
        console.log(`🔄 Mirroring click on: ${selector}`);
        try {
          await apiClient.post('/api/enhanced-browser/click', {
            sessionId: cloudSessionId,
            selector: selector,
          });
        } catch (error) {
          console.error('Failed to mirror click:', error);
        }
      }
      return originalClick(selector, options);
    };

    const originalFill = localPage.fill.bind(localPage);
    localPage.fill = async (selector: string, value: string, options?: any) => {
      if (isMirroring) {
        console.log(`🔄 Mirroring input to ${selector}: ${value}`);
        try {
          await apiClient.post('/api/enhanced-browser/type', {
            sessionId: cloudSessionId,
            selector: selector,
            text: value,
          });
        } catch (error) {
          console.error('Failed to mirror input:', error);
        }
      }
      return originalFill(selector, value, options);
    };

    const originalType = localPage.type.bind(localPage);
    localPage.type = async (selector: string, text: string, options?: any) => {
      if (isMirroring) {
        console.log(`🔄 Mirroring typing to ${selector}: ${text}`);
        try {
          await apiClient.post('/api/enhanced-browser/type', {
            sessionId: cloudSessionId,
            selector: selector,
            text: text,
          });
        } catch (error) {
          console.error('Failed to mirror typing:', error);
        }
      }
      return originalType(selector, text, options);
    };

    // Keep the process running
    console.log('\n💡 Tip: Close the browser window or press Ctrl+C to stop mirroring\n');
    
    // Wait for browser context to close
    await context.waitForEvent('close');
    console.log('\n🛑 Browser closed, stopping mirror...');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cleanup
    isMirroring = false;
    
    if (ws) {
      ws.close();
    }
    
    if (cloudSessionId) {
      try {
        await apiClient.post('/api/enhanced-browser/close', {
          sessionId: cloudSessionId,
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    if (localBrowser) {
      await localBrowser.close();
    }
    
    console.log('✅ Cleanup complete');
  }
} 