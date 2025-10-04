#!/bin/bash

echo "🚀 Setting up Convex for your Pokémon TCG app..."
echo ""

# Check if convex CLI is installed
if ! command -v npx convex &> /dev/null; then
    echo "❌ Convex CLI not found. Installing..."
    npm install -g convex
fi

echo "📦 Initializing Convex project..."
npx convex dev --once

echo ""
echo "✅ Convex setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://dashboard.convex.dev and create a new project"
echo "2. Copy your deployment URL"
echo "3. Add it to .env.local as:"
echo "   NEXT_PUBLIC_CONVEX_URL=your_convex_url_here"
echo ""
echo "4. Run: npm run dev"
echo ""
echo "🎮 Your scanned cards will now persist in the database!"
