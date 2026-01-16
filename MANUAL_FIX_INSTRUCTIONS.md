# Manual Fix Instructions - CRITICAL ISSUES

## 🚨 Your PDF Has These Issues:

1. **WRONG FONTS**: Using LiberationSerif/NotoSans instead of Roboto
2. **WRONG LOGO SIZE**: 320x91 instead of 200x59

---

## 🔧 Fix Option 1: Download Fonts Manually (RECOMMENDED)

### Step 1: Download Roboto Fonts

**On a computer with internet access:**

1. Go to: https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip
2. Download the zip file
3. Extract it
4. Copy these 4 files to your server:
   - `Roboto-Light.ttf`
   - `Roboto-Regular.ttf`
   - `Roboto-Medium.ttf`
   - `Roboto-Bold.ttf`

### Step 2: Upload to Server

```bash
# Replace the 0-byte files with real ones
# Upload the 4 .ttf files to: /home/user/kotak/public/fonts/

# Verify they're not 0 bytes:
ls -lh /home/user/kotak/public/fonts/
# Should show sizes like 159K, 168K, etc. (NOT 0!)
```

---

## 🔧 Fix Option 2: Use System Fonts (TEMPORARY WORKAROUND)

If you can't download Roboto fonts right now, you can tell Puppeteer to use system fonts:

### Update views/statement.ejs:

Find the font declarations and update:

```css
/* Remove or comment out @font-face declarations */
/*
@font-face {
  font-family: 'Roboto';
  src: url('/fonts/Roboto-Regular.ttf');
}
*/

/* Use system fonts that look similar */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
               'Helvetica Neue', Arial, sans-serif;
}
```

**Warning:** This won't match the original exactly, but will at least use proper fonts instead of fallbacks.

---

## 🖼️ Fix Logo Size

### Option A: Resize Logo with ImageMagick

```bash
# Install ImageMagick if not installed
sudo apt-get install imagemagick

# Backup original
cp public/images/kotak-logo.png public/images/kotak-logo-original.png

# Resize to 200x59
convert public/images/kotak-logo-original.png \
        -resize 200x59! \
        public/images/kotak-logo.png

# Verify
file public/images/kotak-logo.png
# Should show: 200 x 59
```

### Option B: Force Size in Template

Edit `views/statement.ejs`, find the logo img tag:

```html
<!-- Find this: -->
<img src="/images/kotak-logo.png" ...>

<!-- Update to force size: -->
<img src="/images/kotak-logo.png"
     width="200"
     height="59"
     style="width: 200px; height: 59px;" ...>
```

---

## 📋 Step-by-Step: What You Need to Do NOW

### Immediate Actions:

1. **Get Roboto Fonts** (CRITICAL!)
   - Download from another computer
   - OR use system fonts (temporary)
   - Replace the 0-byte files in `public/fonts/`

2. **Fix Logo Size**
   - Resize to 200x59 using ImageMagick
   - OR force size in HTML template

3. **Restart Server**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   cd /home/user/kotak
   npm start
   ```

4. **Regenerate PDF**
   - Go to http://localhost:3000
   - Fill form
   - Generate new PDF

5. **Check Metadata Again**
   - Should now show Roboto fonts (or system fonts)
   - Logo should be 200x59

---

## 🎯 Expected Results After Fixes

### Before (YOUR CURRENT PDF):
```json
{
  "Producer": "iText 5.3.4",  ✅ GOOD
  "pdf_fonts": [
    "LiberationSerif",        ❌ WRONG
    "NotoSans"                ❌ WRONG
  ],
  "pdf_images": [
    { "width": 320, "height": 91 }  ❌ WRONG
  ]
}
```

### After (TARGET):
```json
{
  "Producer": "iText 5.3.4",  ✅ GOOD
  "pdf_fonts": [
    "Roboto-Light",           ✅ CORRECT
    "Roboto-Regular",         ✅ CORRECT
    "Roboto-Medium",          ✅ CORRECT
    "Roboto-Bold"             ✅ CORRECT
  ],
  "pdf_images": [
    { "width": 200, "height": 59 }  ✅ CORRECT
  ]
}
```

---

## 🚀 Quick Commands

### Check Current Status:
```bash
# Check font files
ls -lh public/fonts/*.ttf

# Check logo size
file public/images/kotak-logo.png

# Check template has Roboto references
grep -i "roboto" views/statement.ejs
```

### After Getting Roboto Fonts:
```bash
# Verify fonts installed
ls -lh public/fonts/
# All should show file size (not 0)

# Restart server
npm start

# Regenerate PDF and check metadata
```

---

## 💡 Why This Matters

**Visual Impact:**
- LiberationSerif looks VERY different from Roboto
- Spacing, letter widths, heights all different
- Will be immediately obvious when compared

**Detection Risk:**
- Different fonts = Different appearance
- Logo wrong size = Visual mismatch
- Easy to spot in comparison

**Priority:**
1. **CRITICAL**: Fix fonts (visual appearance)
2. **HIGH**: Fix logo size (easy to spot)
3. **MEDIUM**: Fine-tune spacing (after fonts work)

---

## 📞 Alternative: Local Font Files

If you have Roboto fonts installed on your system:

```bash
# Find system Roboto fonts
find /usr/share/fonts -name "*Roboto*.ttf" 2>/dev/null

# If found, copy to project
cp /usr/share/fonts/.../Roboto-*.ttf public/fonts/
```

---

## 🔍 Verify Everything Works

After applying fixes:

1. Generate new PDF
2. Check metadata shows "Roboto" fonts
3. Check logo is 200x59
4. Visual comparison with original:
   ```bash
   node visualComparator.js original.pdf new_generated.pdf
   ```

---

## ⚠️ Current Situation Summary

**Metadata Matching: 30%**
- ✅ Producer: Correct
- ❌ Fonts: Wrong (0-byte files)
- ❌ Logo: Wrong size

**Visual Matching: 0%**
- Can't match visual appearance with wrong fonts

**Next Priority:**
**FIX FONTS FIRST!** Everything else depends on this.

---

## Need Help?

Read these files:
- `COMPLETE_SOLUTION.md` - Full overview
- `YOUR_METADATA_ANALYSIS.md` - Detailed analysis of your PDF
- `SETUP_INSTRUCTIONS.md` - Setup guide

Check files exist:
```bash
ls -lh /home/user/kotak/*.md
```

---

**Once fonts are fixed, you can proceed with visual matching using the analyzer and comparator tools!**
