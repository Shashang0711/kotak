#!/bin/bash

# Font Upload Verification and Instructions
# Run this after uploading fonts to verify they're installed correctly

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              FONT INSTALLATION CHECKER                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check current font status
echo "Current font files in public/fonts/:"
echo "─────────────────────────────────────────────────────────"
ls -lh public/fonts/*.ttf

echo ""
echo "File sizes:"
for font in public/fonts/*.ttf; do
    size=$(stat -f%z "$font" 2>/dev/null || stat -c%s "$font" 2>/dev/null)
    if [ "$size" -eq 0 ]; then
        echo "  ❌ $(basename $font): 0 bytes (EMPTY - NOT INSTALLED)"
    elif [ "$size" -lt 50000 ]; then
        echo "  ⚠️  $(basename $font): $size bytes (TOO SMALL - CORRUPTED?)"
    else
        echo "  ✅ $(basename $font): $size bytes (OK)"
    fi
done

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              HOW TO UPLOAD FONTS                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "METHOD 1: VS Code Drag & Drop (EASIEST)"
echo "─────────────────────────────────────────────────────────"
echo "1. Download fonts on local computer:"
echo "   https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip"
echo ""
echo "2. Extract the zip file"
echo ""
echo "3. In VS Code:"
echo "   - Open 'public/fonts/' folder in left sidebar"
echo "   - Drag these 4 files from your computer:"
echo "     • Roboto-Light.ttf"
echo "     • Roboto-Regular.ttf"
echo "     • Roboto-Medium.ttf"
echo "     • Roboto-Bold.ttf"
echo "   - Drop them into the 'fonts' folder"
echo "   - Click 'Replace' when prompted"
echo ""
echo "4. Run this script again to verify:"
echo "   bash check_font_installation.sh"
echo ""
echo ""
echo "METHOD 2: SCP Upload (Command Line)"
echo "─────────────────────────────────────────────────────────"
echo "From your local computer terminal:"
echo ""
echo "  scp Roboto-*.ttf username@server:/home/user/kotak/public/fonts/"
echo ""
echo "Replace 'username' and 'server' with your actual credentials"
echo ""
echo ""
echo "METHOD 3: SFTP Client (FileZilla, WinSCP, etc.)"
echo "─────────────────────────────────────────────────────────"
echo "1. Connect to server with SFTP client"
echo "2. Navigate to: /home/user/kotak/public/fonts/"
echo "3. Upload the 4 Roboto .ttf files"
echo "4. Verify file sizes are NOT 0 bytes"
echo ""
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              VERIFICATION                                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "After uploading, expected file sizes:"
echo "  • Roboto-Light.ttf:   ~159 KB"
echo "  • Roboto-Regular.ttf: ~168 KB"
echo "  • Roboto-Medium.ttf:  ~168 KB"
echo "  • Roboto-Bold.ttf:    ~168 KB"
echo ""
echo "Once fonts are uploaded:"
echo "  1. Restart Node server: npm start"
echo "  2. Regenerate PDF"
echo "  3. Run comparison:"
echo "     node pdfMetadataComparator.js test.pdf targetMetadata.json"
echo ""
