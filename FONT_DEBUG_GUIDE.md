# Font Loading Debug Guide

## 🔍 How to Debug Font Issues

I've added comprehensive debugging to help you find exactly where font loading is failing.

---

## 🚀 Quick Start

### On Your Local Machine:

```bash
cd ~/Kotak_statement

# Pull the debug code
git pull origin claude/analyze-project-DbSwl

# Verify fonts are installed
ls -lh public/fonts/*.ttf

# Start server with debugging
npm start
```

Then:
1. Open browser: `http://localhost:3000`
2. Generate a PDF
3. **Watch the terminal** - debug output will show where fonts fail

---

## 📊 Debug Output Explained

When you generate a PDF, you'll see this debug output in your terminal:

### Section 1: Font File Check

```
🔍 FONT DEBUG - Checking font files...
Font base path: file:///home/user/kotak/public/fonts
Fonts directory: /home/user/kotak/public/fonts
  ✅ Roboto-Regular.ttf: 349400 bytes
  ✅ Roboto-Bold.ttf: 351108 bytes
  ✅ Roboto-Medium.ttf: 350864 bytes
  ✅ Roboto-Light.ttf: 350028 bytes
```

**What to look for:**
- ✅ All 4 fonts should have green checkmarks
- ✅ File sizes should be ~340-350KB
- ❌ If you see red X or 0 bytes → **FONTS NOT INSTALLED**
- ❌ If you see "(MISSING!)" → **FONT FILES DELETED**
- ❌ If you see "(EMPTY!)" → **FONT FILES ARE 0 BYTES**

**Fix:** If any fonts are missing/empty:
```bash
git pull origin claude/analyze-project-DbSwl  # Pull fonts from repo
ls -lh public/fonts/*.ttf  # Verify they're there
```

---

### Section 2: Fonts in Rendered Page

```
🔍 FONT DEBUG - Checking fonts in rendered page...
Fonts detected in page: 4
  ✅ Roboto (400): loaded
  ✅ Roboto (700): loaded
  ✅ Roboto (500): loaded
  ✅ Roboto (300): loaded
```

**What to look for:**
- ✅ Should show 4 Roboto fonts
- ✅ All should have status: `loaded`
- ❌ If you see `LiberationSerif` → **ROBOTO NOT LOADING**
- ❌ If you see `NotoSans` → **ROBOTO NOT LOADING**
- ❌ If status is `loading` or `unloaded` → **FONTS NOT READY**
- ❌ If count is 0 → **NO FONTS DETECTED**

**What this means:**
- ✅ "loaded" = Fonts loaded successfully in browser
- ❌ "loading" = Still loading (timeout issue)
- ❌ "unloaded" = Font files couldn't be accessed
- ❌ "error" = Font file is corrupt or wrong format

---

### Section 3: Body Font Family

```
Body font-family: Roboto, Arial, sans-serif
```

**What to look for:**
- ✅ Should start with `Roboto`
- ❌ If it's just `Arial` or `sans-serif` → **ROBOTO NOT APPLIED**
- ❌ If it shows `LiberationSerif` → **FALLBACK FONT USED**

**What this means:**
- This shows what font is actually being used on the body element
- If Roboto isn't first, something is wrong with the CSS

---

### Section 4: Font-Face Rules

```
@font-face rules found: 4
  - "Roboto" (400): url("file:///home/user/kotak/public/fonts/Roboto-Regular.ttf")...
  - "Roboto" (700): url("file:///home/user/kotak/public/fonts/Roboto-Bold.ttf")...
  - "Roboto" (500): url("file:///home/user/kotak/public/fonts/Roboto-Medium.ttf")...
  - "Roboto" (300): url("file:///home/user/kotak/public/fonts/Roboto-Light.ttf")...
```

**What to look for:**
- ✅ Should show exactly 4 rules
- ✅ All should use `file://` URLs (absolute paths)
- ✅ Paths should point to your actual fonts directory
- ❌ If count is 0 → **CSS NOT LOADING**
- ❌ If using `/fonts/...` (relative) → **PATHS WRONG**
- ❌ If paths point to wrong directory → **PATH CONFIGURATION ERROR**

**What this means:**
- These are the CSS @font-face rules that tell the browser where to load fonts
- file:// URLs let Puppeteer access local files
- Relative URLs (/fonts/) won't work with setContent()

---

### Section 5: Font Loading Status

```
🔍 FONT DEBUG - Waiting for fonts to load...
Fonts status after waiting: loaded
✅ Font loading complete, generating PDF...
```

**What to look for:**
- ✅ Status should be `loaded`
- ❌ If `loading` → **FONTS STILL LOADING (increase wait time)**
- ❌ If `error` → **FONT FILES CANNOT BE ACCESSED**

---

## 🐛 Common Issues and Solutions

### Issue 1: Fonts Show as "Missing" or "0 bytes"

**Debug Output:**
```
❌ Roboto-Regular.ttf: 0 bytes (EMPTY!)
```

**Cause:** Font files weren't uploaded or got deleted

**Solution:**
```bash
# Pull fonts from git
git pull origin claude/analyze-project-DbSwl

# Verify
ls -lh public/fonts/*.ttf
# Should show ~340-350KB, NOT 0
```

---

### Issue 2: Fonts Detected but Show "unloaded"

**Debug Output:**
```
❌ Roboto (400): unloaded
```

**Cause:** Font file paths are wrong or files can't be accessed

**Check:**
```bash
# Verify file paths match
grep "FONT_BASE_PATH" server.js
# Should show: file:///home/YOUR-USER/Kotak_statement/public/fonts

# Check actual path
pwd
# Make sure it matches FONT_BASE_PATH
```

**Solution:**
Update FONT_BASE_PATH in server.js to use correct path:
```javascript
const FONT_BASE_PATH = `file://${path.join(__dirname, "public", "fonts")}`;
```

---

### Issue 3: Shows LiberationSerif Instead of Roboto

**Debug Output:**
```
Fonts detected in page: 1
  ❌ LiberationSerif (400): loaded
Body font-family: LiberationSerif
```

**Cause:** Roboto fonts not loading, browser using system fallback

**Check:**
1. Are font files there? (Section 1 output)
2. Are @font-face rules correct? (Section 4 output)
3. Are paths using file:// ? (Section 4 output)

**Solution:**
- If files missing: Pull from git
- If paths wrong: Update server.js FONT_BASE_PATH
- If @font-face rules missing: Check views/statement.ejs template

---

### Issue 4: @font-face Rules Count is 0

**Debug Output:**
```
@font-face rules found: 0
```

**Cause:** CSS not being loaded or template error

**Check:**
```bash
# Check template has font-face rules
grep "@font-face" views/statement.ejs
# Should show 4 font-face declarations

# Check fontBasePath is being passed
grep "fontBasePath" server.js
# Should show it in template data
```

**Solution:**
Make sure template uses `<%= fontBasePath %>`:
```css
@font-face {
    font-family: 'Roboto';
    src: url('<%= fontBasePath %>/Roboto-Regular.ttf') format('truetype');
}
```

---

### Issue 5: Fonts Status = "loading" (Never Finishes)

**Debug Output:**
```
Fonts status after waiting: loading
```

**Cause:** Files are loading but too slowly, or network/permissions issue

**Solution:**
Increase wait time in server.js:
```javascript
// Change from 1000ms to 3000ms
await new Promise((resolve) => setTimeout(resolve, 3000));
```

Or check file permissions:
```bash
ls -la public/fonts/*.ttf
# Should be readable by your user
```

---

## 📋 Debug Checklist

Run through this checklist when debugging:

### Before Generating PDF:

- [ ] Pull latest code: `git pull origin claude/analyze-project-DbSwl`
- [ ] Verify fonts exist: `ls -lh public/fonts/*.ttf`
- [ ] All 4 fonts show ~340-350KB (NOT 0 bytes)
- [ ] Server started: `npm start`

### While Generating PDF (Watch Terminal):

- [ ] Section 1: All fonts show ✅ with correct sizes
- [ ] Section 2: 4 Roboto fonts detected, all "loaded"
- [ ] Section 3: Body font-family starts with "Roboto"
- [ ] Section 4: 4 @font-face rules, all using file:// URLs
- [ ] Section 5: Fonts status = "loaded"

### After PDF Generated:

- [ ] Check metadata: `node pdfMetadataComparator.js test.pdf targetMetadata.json`
- [ ] Should show Roboto fonts present (not "Missing")
- [ ] May show "embedded: yes vs no" (this is OK, expected)

---

## 🎯 What Success Looks Like

When everything is working correctly, debug output should look like:

```
🔍 FONT DEBUG - Checking font files...
Font base path: file:///home/user/kotak/public/fonts
Fonts directory: /home/user/kotak/public/fonts
  ✅ Roboto-Regular.ttf: 349400 bytes
  ✅ Roboto-Bold.ttf: 351108 bytes
  ✅ Roboto-Medium.ttf: 350864 bytes
  ✅ Roboto-Light.ttf: 350028 bytes

🔍 FONT DEBUG - Checking fonts in rendered page...
Fonts detected in page: 4
  ✅ Roboto (400): loaded
  ✅ Roboto (700): loaded
  ✅ Roboto (500): loaded
  ✅ Roboto (300): loaded
Body font-family: Roboto, Arial, sans-serif
@font-face rules found: 4
  - "Roboto" (400): url("file:///home/user/kotak/public/fonts/Roboto-Regular.ttf")...
  - "Roboto" (700): url("file:///home/user/kotak/public/fonts/Roboto-Bold.ttf")...
  - "Roboto" (500): url("file:///home/user/kotak/public/fonts/Roboto-Medium.ttf")...
  - "Roboto" (300): url("file:///home/user/kotak/public/fonts/Roboto-Light.ttf")...

🔍 FONT DEBUG - Waiting for fonts to load...
Fonts status after waiting: loaded
✅ Font loading complete, generating PDF...
```

**All ✅ green checkmarks = SUCCESS!**

Then check the PDF:
```bash
node pdfMetadataComparator.js test.pdf targetMetadata.json
```

Should show Roboto fonts present (may show embedded difference - that's expected).

---

## 💡 Still Having Issues?

If after checking all of the above fonts still don't load:

1. **Copy the FULL debug output** from your terminal
2. **Share it** so we can see exactly where it's failing
3. **Run:** `ls -lh public/fonts/*.ttf` and share output
4. **Run:** `grep "FONT_BASE_PATH" server.js` and share output

This will help identify the exact problem!

---

## 🚀 Quick Test Command

```bash
# One-liner to test everything
git pull origin claude/analyze-project-DbSwl && \
ls -lh public/fonts/*.ttf && \
npm start
```

Then generate a PDF and watch for the debug output!

---

**The debug output will tell you EXACTLY where fonts are failing!** 🎯
