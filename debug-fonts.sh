#!/bin/bash

# Font Debugging Helper Script
# This script helps you debug font loading issues

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           FONT LOADING DEBUG HELPER                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Not in Kotak_statement directory"
    echo "   Please run: cd ~/Kotak_statement"
    exit 1
fi

echo "Step 1: Pull Latest Debug Code"
echo "─────────────────────────────────────────────────────────"
git pull origin claude/analyze-project-DbSwl
echo ""

echo "Step 2: Verify Font Files Locally"
echo "─────────────────────────────────────────────────────────"
ls -lh public/fonts/*.ttf
echo ""

echo "Step 3: Check Server Configuration"
echo "─────────────────────────────────────────────────────────"
echo "Font base path in server.js:"
grep "FONT_BASE_PATH =" server.js
echo ""

echo "Step 4: Start Server with Debug Output"
echo "─────────────────────────────────────────────────────────"
echo "Server will now start. When you generate a PDF, watch for:"
echo ""
echo "  🔍 FONT DEBUG - Checking font files..."
echo "    → Should show ✅ for all 4 Roboto fonts with ~342-343KB size"
echo "    → ❌ means file missing or empty"
echo ""
echo "  🔍 FONT DEBUG - Checking fonts in rendered page..."
echo "    → Should list Roboto fonts with 'loaded' status"
echo "    → If you see LiberationSerif or NotoSans, fonts didn't load!"
echo ""
echo "  @font-face rules found: 4"
echo "    → Should show 4 Roboto font-face rules"
echo "    → Each should have file:// URLs"
echo ""
echo "  Body font-family: Roboto, Arial, sans-serif"
echo "    → If it shows just 'Arial' or other, Roboto didn't apply!"
echo ""
echo "  Fonts status after waiting: loaded"
echo "    → Should be 'loaded', not 'loading' or 'error'"
echo ""
echo "Press Ctrl+C to stop the server when done testing"
echo ""
echo "Starting server now..."
echo "═══════════════════════════════════════════════════════════"
echo ""

npm start
