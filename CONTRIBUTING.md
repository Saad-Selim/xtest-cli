# Contributing to @xtest-cli/cli

Thank you for your interest in contributing to the xtest CLI! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check if the issue already exists
2. Try to reproduce the issue with the latest version
3. Collect relevant information (OS, Node.js version, error messages)

When creating an issue, include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- System information
- Error messages or logs

### Suggesting Features

We welcome feature suggestions! Please:
1. Check if the feature has already been requested
2. Clearly describe the use case
3. Explain how it would benefit users
4. Consider implementation complexity

### Pull Requests

#### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/xtest-cli.git
   cd xtest-cli
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/Saad-Selim/xtest-cli.git
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Link for local testing:
   ```bash
   npm link
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

#### Making Changes

1. **Write clean code**:
   - Follow existing code style
   - Use meaningful variable names
   - Add comments for complex logic
   - Keep functions small and focused

2. **Add tests**:
   - Write tests for new features
   - Ensure existing tests pass
   - Aim for good test coverage

3. **Update documentation**:
   - Update README if needed
   - Add JSDoc comments
   - Update command help text

4. **Commit messages**:
   - Use clear, descriptive commit messages
   - Follow conventional commits format:
     ```
     feat: add new browser command option
     fix: resolve WebSocket connection issue
     docs: update installation instructions
     test: add tests for auth service
     ```

#### Submitting PR

1. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request:
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots if relevant
   - Ensure all checks pass

3. Address review feedback:
   - Respond to comments
   - Make requested changes
   - Push updates to the same branch

## Development Guidelines

### Code Style

We use TypeScript with the following conventions:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects/arrays

Run linting:
```bash
npm run lint
```

### Testing

- Write unit tests for services
- Add integration tests for commands
- Test error scenarios
- Mock external dependencies

Run tests:
```bash
npm test
npm run test:watch  # During development
```

### Project Structure

```
cli/
├── src/
│   ├── commands/     # CLI commands
│   ├── services/     # Business logic
│   ├── utils/        # Utilities
│   └── types/        # TypeScript types
├── tests/            # Test files
└── dist/            # Built files
```

### Dependencies

- Minimize external dependencies
- Justify new dependencies in PR
- Keep dependencies up to date
- Use exact versions in package.json

## Release Process

Releases are managed by maintainers:

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Getting Help

- Join our [Discord community](https://discord.gg/xtest)
- Check the [documentation](https://docs.xtest.ing)
- Ask questions in issues
- Email: opensource@xtest.ing

## Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes
- Given credit in the changelog

Thank you for contributing to @xtest/cli! 🎉 