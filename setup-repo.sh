#!/bin/bash

# Script to set up the xtest-cli repository

echo "🚀 Setting up xtest-cli repository..."

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add the remote
echo "🔗 Adding remote repository..."
git remote add origin https://github.com/Saad-Selim/xtest-cli.git

# Create initial commit
echo "📝 Creating initial commit..."
git add .
git commit -m "Initial commit: xtest CLI v0.1.0

- Complete CLI implementation for xtest.ing
- Authentication system with API keys
- Browser control (Chromium, Firefox, WebKit)
- Inspector mode with DevTools
- WebSocket communication
- Session management
- Full TypeScript support
- Test suite and CI/CD setup"

# Push to main branch
echo "⬆️  Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/Saad-Selim/xtest-cli/settings/secrets/actions"
echo "2. Add NPM_TOKEN secret for automated publishing"
echo "3. Run 'npm publish --access public' to publish to NPM" 