#!/bin/bash
# Render Deployment Script
echo "🚀 Starting Render deployment build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Create production build
echo "🔨 Creating production build..."
npm run build

echo "✅ Build completed successfully!"
echo "🌟 Ready for production deployment!"
