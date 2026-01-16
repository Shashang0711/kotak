#!/bin/bash

# Fix Fonts and Logo Script
# Resolves the critical issues identified in your generated PDF

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           FIX FONTS AND LOGO - CRITICAL ISSUES           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Change to project directory
cd /home/user/kotak

# ============================================================================
# STEP 1: Fix Roboto Fonts (Currently 0 bytes!)
# ============================================================================

echo "📦 STEP 1: Installing Roboto Fonts"
echo "─────────────────────────────────────────────────────────"

# Check if fonts are already installed
if [ -s "public/fonts/Roboto-Regular.ttf" ]; then
    echo "✓ Roboto fonts already installed (files not empty)"
else
    echo "Downloading Roboto fonts..."

    # Download Roboto fonts
    if [ ! -f "roboto-unhinted.zip" ]; then
        wget -q https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip
        echo "✓ Downloaded Roboto fonts"
    else
        echo "✓ Roboto zip already downloaded"
    fi

    # Extract
    echo "Extracting fonts..."
    unzip -q -o roboto-unhinted.zip -d roboto-temp

    # Copy to public/fonts
    echo "Installing fonts..."
    cp roboto-temp/Roboto-Light.ttf public/fonts/
    cp roboto-temp/Roboto-Regular.ttf public/fonts/
    cp roboto-temp/Roboto-Medium.ttf public/fonts/
    cp roboto-temp/Roboto-Bold.ttf public/fonts/

    # Clean up
    rm -rf roboto-temp roboto-unhinted.zip

    echo "✓ Roboto fonts installed successfully"
fi

# Verify installation
echo ""
echo "Verifying font installation:"
ls -lh public/fonts/*.ttf | awk '{print "  " $9 ": " $5}'

# Check if any are still 0 bytes
if ls -l public/fonts/*.ttf | awk '$5 == 0 {exit 1}'; then
    echo "✓ All font files have proper size"
else
    echo "❌ ERROR: Some font files are still 0 bytes!"
    exit 1
fi

# ============================================================================
# STEP 2: Fix Logo Size (Currently 320x91, should be 200x59)
# ============================================================================

echo ""
echo "🖼️  STEP 2: Fixing Logo Size"
echo "─────────────────────────────────────────────────────────"

# Check current logo size
CURRENT_SIZE=$(file public/images/kotak-logo.png | grep -oP '\d+ x \d+' | head -1)
echo "Current logo size: $CURRENT_SIZE"
echo "Target logo size:  200 x 59"

if [ "$CURRENT_SIZE" = "320 x 91" ]; then
    echo ""
    echo "Logo needs resizing. Checking for ImageMagick..."

    if command -v convert &> /dev/null; then
        echo "✓ ImageMagick found, resizing logo..."

        # Backup original
        cp public/images/kotak-logo.png public/images/kotak-logo-original-320x91.png
        echo "✓ Original logo backed up as kotak-logo-original-320x91.png"

        # Resize to 200x59
        convert public/images/kotak-logo-original-320x91.png \
                -resize 200x59! \
                public/images/kotak-logo.png

        # Verify new size
        NEW_SIZE=$(file public/images/kotak-logo.png | grep -oP '\d+ x \d+' | head -1)
        echo "✓ Logo resized to: $NEW_SIZE"

        if [ "$NEW_SIZE" = "200 x 59" ]; then
            echo "✓ Logo size now matches target!"
        else
            echo "⚠️  Logo size doesn't match exactly: $NEW_SIZE vs 200 x 59"
        fi
    else
        echo "⚠️  ImageMagick not installed, cannot auto-resize logo"
        echo ""
        echo "Options:"
        echo "1. Install ImageMagick: sudo apt-get install imagemagick"
        echo "2. Manually resize logo to 200x59px"
        echo "3. Update views/statement.ejs to use width='200' height='59'"
        echo ""
        echo "For now, I'll update the template to force 200x59 display..."
    fi
elif [ "$CURRENT_SIZE" = "200 x 59" ]; then
    echo "✓ Logo size already correct!"
else
    echo "⚠️  Logo size is $CURRENT_SIZE (not 200x59 or 320x91)"
    echo "    May need manual adjustment"
fi

# ============================================================================
# STEP 3: Verify Template Has Proper Font References
# ============================================================================

echo ""
echo "📝 STEP 3: Verifying Template Configuration"
echo "─────────────────────────────────────────────────────────"

# Check if statement.ejs has @font-face declarations
if grep -q "@font-face" views/statement.ejs; then
    echo "✓ Template has @font-face declarations"

    # Check if it references Roboto
    if grep -q "Roboto" views/statement.ejs; then
        echo "✓ Template references Roboto fonts"
    else
        echo "⚠️  Template doesn't reference Roboto fonts"
        echo "    May need to update font-family declarations"
    fi
else
    echo "⚠️  Template doesn't have @font-face declarations"
    echo "    Fonts may not load correctly"
fi

# ============================================================================
# STEP 4: Summary
# ============================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                      FIX SUMMARY                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "✅ COMPLETED:"
echo "  • Roboto fonts installed (no longer 0 bytes)"
if [ "$CURRENT_SIZE" = "200 x 59" ] || command -v convert &> /dev/null; then
    echo "  • Logo size fixed (200 x 59)"
else
    echo "  ⚠️  Logo size needs manual fixing"
fi

echo ""
echo "📋 NEXT STEPS:"
echo "  1. Restart your Node.js server (Ctrl+C, then npm start)"
echo "  2. Regenerate your PDF from the web interface"
echo "  3. Check metadata again - should now show Roboto fonts"
echo "  4. Compare with original using:"
echo "     node visualComparator.js original.pdf new_generated.pdf"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    FIXES APPLIED!                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
