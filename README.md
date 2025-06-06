# @xtest-cli/cli

The official CLI for [xtest.ing](https://xtest.ing) - AI-Powered Browser Automation & Test Generation Platform.

[![npm version](https://img.shields.io/npm/v/@xtest-cli/cli.svg)](https://www.npmjs.com/package/@xtest-cli/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- 🌐 **Remote Browser Control**: Control browser sessions running on xtest.ing infrastructure
- 🔍 **Live Browser View**: See what's happening in real-time with headed mode
- 🤖 **AI-Powered Testing**: Generate intelligent test cases using AI
- 🔄 **Session Management**: Create, list, and manage multiple browser sessions
- 🔐 **Secure Authentication**: Email/password authentication with JWT tokens
- 💳 **Subscription-Based**: Requires active xtest.ing subscription

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Active xtest.ing subscription
- xtest.ing account credentials

## 📦 Installation

```bash
npm install -g @xtest-cli/cli@latest
```

## 🔐 Authentication

The CLI uses email/password authentication. You'll need:
1. An active xtest.ing account
2. A valid subscription
3. Your account credentials

### Login

```bash
xtest auth
```

You'll be prompted for:
- **Email**: Your xtest.ing account email
- **Password**: Your account password
- **Server URL**: Default is https://xtest.ing

Example:
```
🔐 Login to xtest.ing

  Note: You need an active subscription to use the CLI
  Sign up at: https://xtest.ing/pricing

  📧 Email: user@example.com
  🔑 Password: ••••••••

✓ Login successful!
✨ Welcome back, John!
   Subscription: Active
```

### Check Authentication Status

```bash
xtest auth status
```

### Logout

```bash
xtest auth logout
```

## 🎯 Quick Start

1. **Install the CLI**
   ```bash
   npm install -g @xtest-cli/cli@latest
   ```

2. **Login to your account**
   ```bash
   xtest auth
   ```

3. **Start a browser session**
   ```bash
   xtest browser --mode headed
   ```

4. **Navigate to a website**
   ```bash
   xtest browser --url https://example.com
   ```

## 📚 Commands

### Authentication Commands

| Command | Description |
|---------|-------------|
| `xtest auth` | Login with your xtest.ing credentials |
| `xtest auth status` | Check authentication and subscription status |
| `xtest auth logout` | Logout and clear stored credentials |

### Browser Commands

| Command | Description |
|---------|-------------|
| `xtest browser` | Start a browser session (headless by default) |
| `xtest browser --mode headed` | Start browser in headed mode (visible) |
| `xtest browser --mode headless` | Start browser in headless mode |
| `xtest browser --url <url>` | Navigate to specific URL on start |
| `xtest browser --type <type>` | Browser type: chromium, firefox, webkit |

### Session Commands

| Command | Description |
|---------|-------------|
| `xtest sessions list` | List all active browser sessions |
| `xtest sessions` | Alias for sessions list |

## 💡 Usage Examples

### Basic Browser Automation
```bash
# Start a visible browser session
xtest browser --mode headed

# Navigate to a specific URL
xtest browser --url https://github.com --mode headed

# Use Firefox instead of Chromium
xtest browser --type firefox --mode headed
```

### Session Management
```bash
# List all your active sessions
xtest sessions list

# Check your authentication status
xtest auth status
```

## 🔒 Security

- **Token-Based**: Uses JWT tokens that expire after 30 days
- **Secure Storage**: Credentials are stored securely in your home directory
- **Subscription Required**: All commands require an active subscription
- **HTTPS Only**: All communication is encrypted

## 💳 Subscription Management

The CLI requires an active xtest.ing subscription. To manage your subscription:

1. Visit [xtest.ing](https://xtest.ing)
2. Login to your account
3. Click on your profile → "Manage Subscription"
4. You'll be redirected to the Stripe customer portal

## 🛠️ Configuration

Configuration is stored in `~/.xtest/config.json`:

```json
{
  "apiKey": "your-jwt-token",
  "serverUrl": "https://xtest.ing"
}
```

## 🐛 Troubleshooting

### "Subscription required" error
- Ensure you have an active subscription at https://xtest.ing/pricing
- Try logging out and logging in again: `xtest auth logout` then `xtest auth`

### "Invalid credentials" error
- Double-check your email and password
- Ensure your account is active
- Try resetting your password on the website

### Connection issues
- Check your internet connection
- Verify the server URL (default: https://xtest.ing)
- Check if you're behind a firewall or proxy

## 📝 Changelog

See [CHANGELOG.md](https://github.com/Saad-Selim/xtest-cli/blob/main/CHANGELOG.md) for version history.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Saad-Selim/xtest-cli/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT - see [LICENSE](https://github.com/Saad-Selim/xtest-cli/blob/main/LICENSE) for details.

## 🆘 Support

- 📧 Email: support@xtest.ing
- 🌐 Website: [xtest.ing](https://xtest.ing)
- 🐛 Issues: [GitHub Issues](https://github.com/Saad-Selim/xtest-cli/issues)

---

Made with ❤️ by the [xtest.ing](https://xtest.ing) team 