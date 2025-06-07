import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import axios from 'axios';

export interface BrowserControllerOptions {
  sessionId: string;
  serverUrl: string;
  apiKey: string;
  browserOptions: {
    mode: string;
    browserType: string;
    devtools: boolean;
    slowMo: number;
    record: boolean;
  };
}

export class BrowserController extends EventEmitter {
  private options: BrowserControllerOptions;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private ws: WebSocket | null = null;
  private serverSessionId: string | null = null;
  private isMirroring = false;

  constructor(options: BrowserControllerOptions) {
    super();
    this.options = options;
  }

  async start() {
    try {
      // First, create a mirror browser session on the server
      this.emit('connecting');
      
      const createResponse = await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/inspector/create`,
        {
          sessionId: this.options.sessionId,
          headless: true, // Server browser is always headless
          devtools: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!createResponse.data.success) {
        throw new Error(createResponse.data.error || 'Failed to create server browser session');
      }

      this.serverSessionId = createResponse.data.sessionId;
      console.log(`\n✅ Server mirror session created: ${this.serverSessionId}`);
      
      // Start streaming the server browser to dashboard
      await this.startServerStreaming();
      
      // Launch local browser
      await this.launchLocalBrowser();
      
      // Connect WebSocket for real-time sync
      await this.connectWebSocket();
      
      // Start mirroring local actions to server
      this.startMirroring();
      
    } catch (error: any) {
      console.error('Failed to start browser session:', error.message);
      throw error;
    }
  }

  private async launchLocalBrowser() {
    const { mode, browserType, devtools, slowMo, record } = this.options.browserOptions;
    
    // Select browser type
    const browserLauncher = {
      chromium,
      firefox,
      webkit,
    }[browserType] || chromium;

    // Launch options
    const launchOptions: any = {
      headless: mode === 'headless',
      devtools: devtools && mode === 'inspector',
      slowMo,
    };

    console.log(`Launching local ${browserType} browser...`);
    this.browser = await browserLauncher.launch(launchOptions);

    // Create context
    const contextOptions: any = {
      viewport: { width: 1280, height: 720 },
    };

    if (record) {
      contextOptions.recordVideo = {
        dir: './recordings',
        size: { width: 1280, height: 720 },
      };
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    // Set up page event handlers
    this.page.on('console', (msg) => {
      console.log(`[Browser Console] ${msg.text()}`);
    });

    this.page.on('pageerror', (error) => {
      console.error(`[Browser Error] ${error.message}`);
    });
  }

  private async connectWebSocket() {
    const wsUrl = this.options.serverUrl.replace('http', 'ws') + '/cli/connect';
    console.log(`Connecting to ${wsUrl}...`);
    
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${this.options.apiKey}`,
        'x-session-id': this.options.sessionId,
        'x-cli-version': '0.3.1',
        'x-browser-mode': this.options.browserOptions.mode,
      },
    });

    this.ws.on('open', () => {
      this.emit('connected');
      console.log('\n✅ Connected to xtest.ing');
      console.log('🔄 Local browser actions will be mirrored to dashboard');
      
      // Send initial status
      this.sendMessage({
        type: 'status',
        data: {
          browser: this.options.browserOptions.browserType,
          mode: this.options.browserOptions.mode,
          serverSessionId: this.serverSessionId,
          mirroring: true,
        },
      });
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Invalid message from server:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('\n🔌 Disconnected from server');
      this.isMirroring = false;
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private startMirroring() {
    if (!this.page || this.isMirroring) return;
    
    this.isMirroring = true;
    
    // Mirror navigation
    this.page.on('framenavigated', async (frame) => {
      if (frame === this.page?.mainFrame()) {
        const url = frame.url();
        console.log(`[Local Browser] Navigated to: ${url}`);
        
        // Mirror to server browser
        if (this.serverSessionId && url !== 'about:blank') {
          await this.mirrorNavigation(url);
        }
      }
    });

    // Intercept and mirror all requests that might change the page
    this.page.on('request', async (request) => {
      // Log navigation requests
      if (request.isNavigationRequest() && request.frame() === this.page?.mainFrame()) {
        console.log(`[Local Browser] Navigation request: ${request.url()}`);
      }
    });

    // Use page evaluation to track clicks and inputs
    this.page.addInitScript(() => {
      // Track clicks
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const selector = target.tagName.toLowerCase() + 
          (target.id ? `#${target.id}` : '') + 
          (target.className ? `.${target.className.split(' ').join('.')}` : '');
        console.log('Click detected:', selector);
        // Send to CLI via console log which we'll intercept
        console.log(`__CLI_MIRROR_CLICK__:${selector}`);
      }, true);

      // Track inputs
      document.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const selector = target.tagName.toLowerCase() + 
          (target.id ? `#${target.id}` : '') + 
          (target.className ? `.${target.className.split(' ').join('.')}` : '');
        console.log(`__CLI_MIRROR_INPUT__:${selector}:${target.value}`);
      }, true);
    });

    // Intercept console messages to handle mirror commands
    this.page.on('console', async (msg) => {
      const text = msg.text();
      if (text.startsWith('__CLI_MIRROR_CLICK__:')) {
        const selector = text.replace('__CLI_MIRROR_CLICK__:', '');
        console.log(`[Local Browser] Clicked: ${selector}`);
        await this.mirrorAction('click', { selector });
      } else if (text.startsWith('__CLI_MIRROR_INPUT__:')) {
        const parts = text.replace('__CLI_MIRROR_INPUT__:', '').split(':');
        const selector = parts[0];
        const value = parts.slice(1).join(':');
        console.log(`[Local Browser] Input: ${selector}`);
        await this.mirrorAction('type', { selector, text: value });
      }
    });
  }

  private async mirrorNavigation(url: string) {
    try {
      await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/inspector/navigate`,
        { 
          sessionId: this.serverSessionId,
          url, 
        },
        {
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(`[Server Mirror] Navigated to: ${url}`);
    } catch (error) {
      console.error('Failed to mirror navigation:', error);
    }
  }

  private async mirrorAction(action: string, params: any) {
    try {
      await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/inspector/execute`,
        { 
          sessionId: this.serverSessionId,
          action,
          params,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(`[Server Mirror] Executed: ${action}`);
    } catch (error) {
      console.error(`Failed to mirror ${action}:`, error);
    }
  }

  private async startServerStreaming() {
    try {
      await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/start-stream`,
        { sessionId: this.serverSessionId },
        {
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('🎥 Server browser streaming started - view in dashboard');
    } catch (error) {
      console.error('Failed to start server streaming:', error);
    }
  }

  private handleServerMessage(message: any) {
    switch (message.type) {
    case 'connected':
      console.log(`Session acknowledged: ${message.data.sessionId}`);
      break;
    default:
      // Handle other message types if needed
      break;
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  async stop() {
    this.isMirroring = false;
    
    // Stop server streaming
    if (this.serverSessionId) {
      try {
        await axios.post(
          `${this.options.serverUrl}/api/enhanced-browser/stop-stream`,
          { sessionId: this.serverSessionId },
          {
            headers: {
              'Authorization': `Bearer ${this.options.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );
      } catch (error) {
        // Ignore streaming stop errors
      }
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Close local browser
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Local browser closed');
    }

    // Close server browser session
    if (this.serverSessionId) {
      try {
        await axios.delete(
          `${this.options.serverUrl}/api/enhanced-browser/inspector/${this.serverSessionId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.options.apiKey}`,
            },
          },
        );
        console.log('✅ Server mirror session closed');
      } catch (error) {
        console.error('Failed to close server session:', error);
      }
    }
  }
} 