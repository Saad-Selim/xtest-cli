# Changelog

All notable changes to @xtest-cli/cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @xtest/cli
- Authentication commands (`auth login`, `auth logout`, `auth status`)
- Browser control commands (`browser start`, `browser stop`)
- Session management commands (`sessions list`, `sessions connect`)
- Support for Chromium, Firefox, and WebKit browsers
- Inspector mode with DevTools integration
- WebSocket connection for real-time browser control
- Auto-reconnect capability for resilient connections
- Configuration management in `~/.xtest/config.json`
- TypeScript support with full type definitions

### Security
- Secure API key storage in user home directory
- Encrypted WebSocket communication with xtest.ing platform

## [0.1.3] - 2025-01-10

### Added
- Interactive mode for browser command with `--interactive` flag
- Welcome banner and improved visual feedback throughout the CLI
- Better error messages with helpful tips
- Session configuration preview before starting
- Enhanced authentication flow with existing credential check
- Spinner animations for better progress indication
- Browser and mode icons for better visual distinction
- Custom help formatting with examples

### Changed
- Improved UX/UI for all commands with better colors and formatting
- Enhanced `xtest auth` command with step-by-step instructions
- Better `xtest auth status` display with connection checking
- More informative `xtest browser list` command with examples
- Default browser mode changed from 'inspector' to 'headed'
- API key masking for security (shows only first 4 and last 4 characters)

### Fixed
- Better error handling with specific messages for different failure scenarios
- Improved validation for server URLs and API keys

## [0.1.2] - 2025-01-10

### Changed
- Updated installation instructions to use `@latest` tag for clarity
- Improved README documentation

### Fixed
- Minor documentation improvements

## [0.1.1] - 2025-01-10

### Fixed
- Fixed WebSocket connection stability issue where CLI would disconnect immediately after receiving "connected" message
- Improved error handling for unknown commands from server
- Enhanced connection acknowledgment flow

## [0.1.0] - 2025-01-10

### Added
- Initial release of @xtest-cli/cli
- Browser control commands (start, stop)
- Authentication system
- WebSocket connection to xtest.ing server
- Support for Chromium, Firefox, and WebKit browsers
- Inspector mode with DevTools
- Session management
- Configuration storage in ~/.xtest/config.json

---

## Version Guidelines

- **Major version (1.0.0)**: Breaking changes
- **Minor version (0.1.0)**: New features, backwards compatible
- **Patch version (0.0.1)**: Bug fixes, backwards compatible 