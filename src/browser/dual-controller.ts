import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import axios from 'axios';

export interface DualBrowserOptions {
  sessionId: string;
  serverUrl: string;
  apiKey: string;
  localBrowserOptions?: {
    browserType: string;
    headless: boolean;
    devtools: boolean;
    slowMo: number;
  };
}

export interface BrowserTarget {
  type: 'local' | 'cloud' | 'both';
}

export class DualBrowserController extends EventEmitter {
  private options: DualBrowserOptions;
  
  // Local browser
  private localBrowser?: Browser;
  private localContext?: BrowserContext;
  private localPage?: Page;
  
  // Cloud browser session
  private cloudSessionId?: string;
  private ws?: WebSocket;
  
  constructor(options: DualBrowserOptions) {
    super();
    this.options = options;
  }

  async start() {
    console.log('\n🚀 Starting Dual Browser Control\n');
    
    // Start local browser
    await this.startLocalBrowser();
    
    // Start cloud browser
    await this.startCloudBrowser();
    
    // Connect WebSocket for real-time cloud control
    await this.connectWebSocket();
    
    console.log('\n✅ Both browsers ready for independent control!');
    console.log('📍 Local browser: Direct Playwright control');
    console.log('☁️  Cloud browser: API/WebSocket control\n');
  }

  private async startLocalBrowser() {
    const options = this.options.localBrowserOptions || {
      browserType: 'chromium',
      headless: false,
      devtools: false,
      slowMo: 100,
    };

    console.log('🖥️  Starting local browser...');
    
    const browserLauncher = {
      chromium,
      firefox,
      webkit,
    }[options.browserType] || chromium;

    this.localBrowser = await browserLauncher.launch({
      headless: options.headless,
      devtools: options.devtools,
      slowMo: options.slowMo,
    });

    this.localContext = await this.localBrowser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    
    this.localPage = await this.localContext.newPage();
    console.log('✅ Local browser started');
  }

  private async startCloudBrowser() {
    console.log('☁️  Starting cloud browser...');
    
    try {
      const response = await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/inspector/create`,
        {
          sessionId: `cloud-${this.options.sessionId}`,
          headless: false, // Cloud browser can be headed for streaming
          devtools: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create cloud browser');
      }

      this.cloudSessionId = response.data.sessionId;
      console.log(`✅ Cloud browser started: ${this.cloudSessionId}`);
      
      // Start streaming
      await this.startCloudStreaming();
    } catch (error: any) {
      console.error('Failed to start cloud browser:', error.message);
      throw error;
    }
  }

  private async connectWebSocket() {
    const wsUrl = this.options.serverUrl.replace('http', 'ws') + '/cli/connect';
    
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${this.options.apiKey}`,
        'x-session-id': this.options.sessionId,
        'x-cli-version': '0.4.0',
        'x-mode': 'dual-control',
      },
    });

    return new Promise((resolve, reject) => {
      this.ws!.on('open', () => {
        console.log('✅ Connected to cloud control');
        this.sendMessage({
          type: 'dual-control-init',
          data: {
            localSessionId: this.options.sessionId,
            cloudSessionId: this.cloudSessionId,
          },
        });
        resolve(undefined);
      });

      this.ws!.on('error', reject);
    });
  }

  private async startCloudStreaming() {
    try {
      await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/start-stream`,
        { sessionId: this.cloudSessionId },
        {
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('🎥 Cloud browser streaming started');
    } catch (error) {
      console.error('Failed to start cloud streaming:', error);
    }
  }

  // Navigation methods
  async navigate(target: BrowserTarget, url: string) {
    if (target.type === 'local' || target.type === 'both') {
      console.log(`[Local] Navigating to: ${url}`);
      await this.localPage?.goto(url);
    }
    
    if (target.type === 'cloud' || target.type === 'both') {
      console.log(`[Cloud] Navigating to: ${url}`);
      await this.cloudNavigate(url);
    }
  }

  // Click methods
  async click(target: BrowserTarget, selector: string) {
    if (target.type === 'local' || target.type === 'both') {
      console.log(`[Local] Clicking: ${selector}`);
      await this.localPage?.click(selector);
    }
    
    if (target.type === 'cloud' || target.type === 'both') {
      console.log(`[Cloud] Clicking: ${selector}`);
      await this.cloudAction('click', { selector });
    }
  }

  // Type methods
  async type(target: BrowserTarget, selector: string, text: string) {
    if (target.type === 'local' || target.type === 'both') {
      console.log(`[Local] Typing in: ${selector}`);
      await this.localPage?.fill(selector, text);
    }
    
    if (target.type === 'cloud' || target.type === 'both') {
      console.log(`[Cloud] Typing in: ${selector}`);
      await this.cloudAction('type', { selector, text });
    }
  }

  // Screenshot methods
  async screenshot(target: BrowserTarget, filename?: string) {
    const screenshots: { local?: Buffer; cloud?: Buffer } = {};
    
    if (target.type === 'local' || target.type === 'both') {
      console.log('[Local] Taking screenshot');
      const localPath = filename ? `local-${filename}` : `local-screenshot-${Date.now()}.png`;
      screenshots.local = await this.localPage?.screenshot({ path: localPath });
      console.log(`[Local] Screenshot saved: ${localPath}`);
    }
    
    if (target.type === 'cloud' || target.type === 'both') {
      console.log('[Cloud] Taking screenshot');
      const cloudPath = filename ? `cloud-${filename}` : `cloud-screenshot-${Date.now()}.png`;
      await this.cloudAction('screenshot', { filename: cloudPath });
      console.log(`[Cloud] Screenshot saved: ${cloudPath}`);
    }
    
    return screenshots;
  }

  // Evaluate JavaScript
  async evaluate(target: BrowserTarget, script: string) {
    const results: { local?: any; cloud?: any } = {};
    
    if (target.type === 'local' || target.type === 'both') {
      console.log('[Local] Evaluating script');
      results.local = await this.localPage?.evaluate(script);
    }
    
    if (target.type === 'cloud' || target.type === 'both') {
      console.log('[Cloud] Evaluating script');
      results.cloud = await this.cloudAction('evaluate', { script });
    }
    
    return results;
  }

  // Cloud browser control methods
  private async cloudNavigate(url: string) {
    try {
      await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/inspector/navigate`,
        { 
          sessionId: this.cloudSessionId,
          url, 
        },
        {
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Cloud navigation failed:', error);
      throw error;
    }
  }

  private async cloudAction(action: string, params: any) {
    try {
      const response = await axios.post(
        `${this.options.serverUrl}/api/enhanced-browser/inspector/execute`,
        { 
          sessionId: this.cloudSessionId,
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
      return response.data.result;
    } catch (error) {
      console.error(`Cloud action ${action} failed:`, error);
      throw error;
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Get page info
  async getPageInfo(target: BrowserTarget) {
    const info: { local?: any; cloud?: any } = {};
    
    if (target.type === 'local' || target.type === 'both') {
      info.local = {
        url: this.localPage?.url(),
        title: await this.localPage?.title(),
      };
    }
    
    if (target.type === 'cloud' || target.type === 'both') {
      info.cloud = await this.cloudAction('pageInfo', {});
    }
    
    return info;
  }

  // Wait for selector
  async waitForSelector(target: BrowserTarget, selector: string, options?: any) {
    if (target.type === 'local' || target.type === 'both') {
      console.log(`[Local] Waiting for: ${selector}`);
      await this.localPage?.waitForSelector(selector, options);
    }
    
    if (target.type === 'cloud' || target.type === 'both') {
      console.log(`[Cloud] Waiting for: ${selector}`);
      await this.cloudAction('waitForSelector', { selector, options });
    }
  }

  async stop() {
    console.log('\n🛑 Stopping dual browser control...');
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
    }
    
    // Close local browser
    if (this.localBrowser) {
      await this.localBrowser.close();
      console.log('✅ Local browser closed');
    }
    
    // Close cloud browser
    if (this.cloudSessionId) {
      try {
        await axios.delete(
          `${this.options.serverUrl}/api/enhanced-browser/inspector/${this.cloudSessionId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.options.apiKey}`,
            },
          },
        );
        console.log('✅ Cloud browser closed');
      } catch (error) {
        console.error('Failed to close cloud browser:', error);
      }
    }
  }
} 