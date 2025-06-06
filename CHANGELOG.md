# Changelog

All notable changes to @xtest/cli will be documented in this file.

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

## [0.1.1] - 2025-06-06

### Fixed
- Fixed WebSocket message handling to properly handle "connected" acknowledgment from server
- Resolved "Unknown command: connected" error when establishing connection

## [0.1.0] - 2025-06-05

### Added
- Initial beta release for internal testing

---

## Version Guidelines

- **Major version (1.0.0)**: Breaking changes
- **Minor version (0.1.0)**: New features, backwards compatible
- **Patch version (0.0.1)**: Bug fixes, backwards compatible 