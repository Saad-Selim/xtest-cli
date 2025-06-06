# @xtest-cli/cli

The official open-source CLI for [xtest.ing](https://xtest.ing) - a powerful browser automation platform.

> **Note**: This CLI is open-source and free to use. The xtest.ing platform itself is a proprietary service. You'll need an xtest.ing account and API key to use this CLI.

## About

The xtest CLI allows you to control browser automation sessions from your local machine, providing features like:

- 🖥️ **Local Browser Control**: Run browsers on your machine while they're controlled by xtest.ing
- 🔍 **Inspector Mode**: Open browsers with DevTools for debugging
- 🌐 **Multi-Browser Support**: Works with Chromium, Firefox, and WebKit
- 🔄 **Live Connection**: Real-time bidirectional communication with xtest.ing

## Installation

```bash
npm install -g @xtest-cli/cli@latest
```

## Quick Start

1. **Authenticate with your xtest.ing account:**
   ```bash
   xtest auth login
   ```

2. **Start a browser session:**
   ```bash
   xtest browser start --inspector
   ```

3. **List active sessions:**
   ```bash
   xtest sessions list
   ```

## Commands

### Authentication
- `xtest auth login` - Login to your xtest.ing account
- `xtest auth logout` - Logout and clear credentials
- `xtest auth status` - Check authentication status

### Browser Control
- `xtest browser start [options]` - Start a new browser session
  - `--type <browser>` - Browser type: chromium (default), firefox, webkit
  - `--inspector` - Enable DevTools inspector
  - `--session <id>` - Connect to specific session ID

- `xtest browser stop` - Stop the current browser session

### Session Management
- `xtest sessions list` - List all active sessions
- `xtest sessions connect <id>` - Connect to an existing session

## How It Works

The CLI creates a secure WebSocket connection between your local machine and the xtest.ing platform:

```
xtest.ing Server → WebSocket → CLI → Local Browser
```

This architecture allows you to:
- See browser actions in real-time during development
- Debug automation scripts with full DevTools access
- Run browsers locally while leveraging xtest.ing's automation capabilities

## Configuration

Configuration is stored in `~/.xtest/config.json`:

```json
{
  "apiKey": "your-api-key",
  "apiUrl": "https://xtest.ing",
  "wsUrl": "wss://xtest.ing"
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/xtest/cli.git
   cd cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Link for local development:
   ```bash
   npm link
   ```

### Running Tests

```bash
npm test
```

## Security

- API keys are stored locally in your home directory
- All communication with xtest.ing is encrypted
- Browser sessions are isolated and secure

## License

MIT - see [LICENSE](LICENSE) for details.

## Support

- 📧 Email: support@xtest.ing
- 💬 Discord: [Join our community](https://discord.gg/xtest)
- 📚 Docs: [https://docs.xtest.ing](https://docs.xtest.ing)

---

Made with ❤️ by the xtest.ing team 