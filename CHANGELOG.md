# Changelog

All notable changes to the @xtest-cli/cli package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-01-06

### Changed
- CLI now opens a local browser AND mirrors actions to a server browser
- Dashboard shows the server browser that mirrors your local actions
- Best of both worlds: local control with dashboard visibility

### How it works
1. CLI opens a browser on your laptop
2. CLI creates a mirror browser on the server
3. Every action in your local browser is mirrored to the server browser
4. Dashboard shows the server browser in real-time

### Fixed
- Reverted breaking change from 0.3.0
- Local browser control is restored
- Dashboard visibility is maintained through mirroring

## [0.3.0] - 2025-01-06

### Changed
- **BREAKING**: CLI now creates server-side browser sessions instead of local browsers
- Browser sessions are now visible and controllable from the dashboard
- All browser actions happen on the server, not locally
- Added browser streaming support for dashboard viewing

### Fixed
- CLI sessions now appear in the dashboard
- Browser actions are properly synchronized with the server

### Technical
- Replaced local Playwright browser with server API calls
- Uses `/api/enhanced-browser/inspector/create` for session creation
- Implements proper WebSocket communication for real-time updates

## [0.2.1] - 2025-01-06

### 🔄 Breaking Changes
- Changed authentication from API keys to email/password login
- All CLI commands now require an active subscription
- Removed `xtest auth login` in favor of simpler `xtest auth` command

### ✨ New Features
- Email/password authentication with JWT tokens
- Subscription status checking on login
- Improved authentication flow with better error messages
- Token expiration handling (30-day expiry)

### 🛠️ Improvements
- Better error messages for subscription requirements
- Clearer onboarding process for new users
- Enhanced security with JWT token authentication
- Simplified command structure

### 📝 Documentation
- Updated README with new authentication flow
- Added subscription management instructions
- Improved troubleshooting section
- Added security information

## [0.1.4] - 2025-01-05

### 🐛 Bug Fixes
- Fixed WebSocket connection stability issues
- Improved error handling for network failures
- Fixed session cleanup on unexpected disconnection

### 🛠️ Improvements
- Better logging for debugging connection issues
- Improved CLI response times
- Enhanced browser session management

## [0.1.3] - 2025-01-04

### ✨ Features
- Added support for Firefox and WebKit browsers
- Implemented session persistence across CLI restarts
- Added `--url` flag for direct navigation on browser start

### 🐛 Bug Fixes
- Fixed issue with headed mode not showing browser window
- Resolved memory leak in long-running sessions

## [0.1.2] - 2025-01-03

### ✨ Features
- Added `xtest sessions list` command
- Implemented browser type selection (Chromium, Firefox, WebKit)
- Added connection status indicator

### 🛠️ Improvements
- Better error messages for common issues
- Improved WebSocket reconnection logic
- Enhanced CLI help documentation

## [0.1.1] - 2025-01-02

### 🐛 Bug Fixes
- Fixed authentication token storage issue
- Resolved Windows compatibility problems
- Fixed issue with special characters in passwords

## [0.1.0] - 2025-01-01

### 🎉 Initial Release
- Basic authentication with API keys
- Browser control (headed/headless modes)
- WebSocket connection to xtest.ing platform
- Session management
- Cross-platform support (Windows, macOS, Linux)

---

## Version Guidelines

- **Major version (1.0.0)**: Breaking changes
- **Minor version (0.1.0)**: New features, backwards compatible
- **Patch version (0.0.1)**: Bug fixes, backwards compatible 