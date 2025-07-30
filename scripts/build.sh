#!/bin/bash

# Build script for Appium Inspector Electron app

echo "🚀 Building Appium Inspector..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build web application
echo "🏗️  Building web application..."
pnpm build

# Build Electron app
echo "⚡ Building Electron application..."
pnpm electron:build

echo "✅ Build complete! Check the release/ directory for the built application."

# Show build output
if [ -d "release" ]; then
    echo "📂 Built files:"
    ls -la release/
else
    echo "❌ Build failed - no release directory found"
fi 