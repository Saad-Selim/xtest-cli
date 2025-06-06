import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import WebSocket from 'ws';
import chalk from 'chalk';
import { EventEmitter } from 'events';

interface BrowserControllerOptions {
  sessionId: string;
  serverUrl: string;
  apiKey: string;
  browserOptions: {
    mode: 'inspector' | 'headed' | 'headless';
    browserType: 'chromium' | 'firefox' | 'webkit';
    devtools: boolean;
    slowMo: number;
    record?: boolean;
  };
}

interface Command {
  id: string;
  type: string;
  params?: any;
}

export class BrowserController extends EventEmitter {
  private options: BrowserControllerOptions;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private ws?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(options: BrowserControllerOptions) {
    super();
    this.options = options;
  }

  async start(): Promise<void> {
    // Launch browser
    await this.launchBrowser();
    
    // Connect to WebSocket
    await this.connectWebSocket();
  }

  private async launchBrowser(): Promise<void> {
    const { mode, browserType, devtools, slowMo, record } = this.options.browserOptions;
    
    // Select browser type
    const browserLauncher = {
      chromium,
      firefox,
      webkit,
    }[browserType];

    // Launch options
    const launchOptions: any = {
      headless: mode === 'headless',
      devtools: devtools && mode === 'inspector',
      slowMo,
    };

    // Add browser-specific options
    if (browserType === 'chromium') {
      launchOptions.args = ['--start-maximized'];
    }

    console.log(chalk.gray(`Launching ${browserType} browser...`));
    this.browser = await browserLauncher.launch(launchOptions);

    // Create context with recording if enabled
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

    // Navigate to initial page
    await this.page.goto('about:blank');
    await this.page.evaluate((sessionId: string) => {
      document.body.innerHTML = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        ">
          <div>
            <h1 style="font-size: 48px; margin-bottom: 20px;">xtest CLI Browser</h1>
            <p style="font-size: 24px; opacity: 0.9;">Connected to xtest.ing</p>
            <p style="font-size: 18px; opacity: 0.7; margin-top: 20px;">Session: ${sessionId}</p>
            <div style="margin-top: 40px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
              <p style="font-size: 16px;">This browser is controlled remotely</p>
              <p style="font-size: 14px; opacity: 0.8; margin-top: 10px;">You can interact with it manually or let xtest.ing control it</p>
            </div>
          </div>
        </div>
      `;
    }, this.options.sessionId);

    // Handle page events
    this.page.on('console', (msg) => {
      console.log(chalk.gray(`[Browser Console] ${msg.text()}`));
    });

    this.page.on('pageerror', (error) => {
      console.error(chalk.red(`[Browser Error] ${error.message}`));
    });
  }

  private async connectWebSocket(): Promise<void> {
    const wsUrl = this.options.serverUrl.replace(/^http/, 'ws');
    const url = `${wsUrl}/cli/connect`;

    console.log(chalk.gray(`Connecting to ${url}...`));

    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${this.options.apiKey}`,
        'X-Session-ID': this.options.sessionId,
        'X-CLI-Version': '0.1.0',
      },
    });

    this.ws.on('open', () => {
      console.log(chalk.green('✅ Connected to xtest.ing'));
      this.reconnectAttempts = 0;
      
      // Send initial status
      this.sendMessage({
        type: 'status',
        data: {
          browser: this.options.browserOptions.browserType,
          mode: this.options.browserOptions.mode,
          ready: true,
        },
      });
    });

    this.ws.on('message', async (data) => {
      try {
        const command: Command = JSON.parse(data.toString());
        await this.handleCommand(command);
      } catch (error) {
        console.error(chalk.red('Failed to handle command:'), error);
      }
    });

    this.ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error.message);
    });

    this.ws.on('close', () => {
      console.log(chalk.yellow('Disconnected from server'));
      this.handleReconnect();
    });
  }

  private async handleCommand(command: Command): Promise<void> {
    if (!this.page) return;

    console.log(chalk.blue(`→ ${command.type}`), chalk.gray(JSON.stringify(command.params || {})));

    try {
      let result: any;

      switch (command.type) {
      case 'navigate':
        await this.page.goto(command.params.url, { waitUntil: 'domcontentloaded' });
        result = { url: this.page.url() };
        break;

      case 'click':
        await this.page.click(command.params.selector);
        result = { success: true };
        break;

      case 'type':
        await this.page.fill(command.params.selector, command.params.text);
        result = { success: true };
        break;

      case 'screenshot': {
        const screenshot = await this.page.screenshot();
        result = { data: screenshot.toString('base64') };
        break;
      }

      case 'evaluate':
        result = await this.page.evaluate(command.params.script);
        break;

      case 'waitForSelector':
        await this.page.waitForSelector(command.params.selector, {
          timeout: command.params.timeout || 30000,
        });
        result = { success: true };
        break;

      case 'select':
        await this.page.selectOption(command.params.selector, command.params.value);
        result = { success: true };
        break;

      case 'press':
        await this.page.press(command.params.selector, command.params.key);
        result = { success: true };
        break;

      default:
        throw new Error(`Unknown command: ${command.type}`);
      }

      // Send response
      this.sendMessage({
        type: 'response',
        commandId: command.id,
        data: result,
      });

    } catch (error: any) {
      console.error(chalk.red(`Command failed: ${error.message}`));
      
      // Send error response
      this.sendMessage({
        type: 'error',
        commandId: command.id,
        error: error.message,
      });
    }
  }

  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(chalk.red('Max reconnection attempts reached'));
      await this.stop();
      process.exit(1);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(chalk.yellow(`Reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`));
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  async stop(): Promise<void> {
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
    }

    console.log(chalk.green('✅ Browser session closed'));
  }
} 