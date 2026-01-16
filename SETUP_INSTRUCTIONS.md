# Setup Instructions for Metadata Matching

## Quick Start

Follow these steps to set up metadata matching for your generated PDFs.

---

## Step 1: Install System Dependencies

The comparison tools require **poppler-utils** for PDF analysis:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install poppler-utils

# MacOS
brew install poppler

# Verify installation
pdfinfo --version
```

---

## Step 2: Fix Missing Font Files ⚠️

Your font files are currently **0 bytes**. Download proper Roboto fonts:

```bash
# Navigate to project directory
cd /home/user/kotak

# Download Roboto fonts
wget https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip

# Extract
unzip roboto-unhinted.zip -d roboto-temp

# Copy to public/fonts (overwrite the 0-byte files)
cp roboto-temp/Roboto-Light.ttf public/fonts/
cp roboto-temp/Roboto-Regular.ttf public/fonts/
cp roboto-temp/Roboto-Medium.ttf public/fonts/
cp roboto-temp/Roboto-Bold.ttf public/fonts/

# Verify
ls -lh public/fonts/

# Clean up
rm -rf roboto-temp roboto-unhinted.zip
```

---

## Step 3: Verify Files Are Present

Check that all new files are in place:

```bash
ls -lh /home/user/kotak/

# You should see:
# - targetMetadata.json
# - pdfMetadataComparator.js
# - enhancedMetadataModifier.js
# - METADATA_MATCHING_GUIDE.md
# - SETUP_INSTRUCTIONS.md
```

---

## Step 4: Test the Server

Start your server to verify the updated metadata function works:

```bash
# Start in development mode
npm run dev

# OR start in production mode
npm start

# You should see:
# ✓ Target metadata loaded successfully
# Server running on 3000
```

---

## Step 5: Generate a Test PDF

1. Open browser: `http://localhost:3000`
2. Fill in the form with test data
3. Click "Generate & Download PDF"
4. Save the PDF as `test-generated.pdf`

---

## Step 6: Compare Metadata

Run the comparison tool to see how close your PDF matches the target:

```bash
node pdfMetadataComparator.js test-generated.pdf targetMetadata.json
```

**Expected Output:**
```
Extracting metadata from generated PDF...

============================================
PDF METADATA COMPARISON REPORT
============================================

🚨 CRITICAL DIFFERENCES (Will be detected):
────────────────────────────────────────────

Field: Producer
  Generated: Chromium
  Target:    iText 5.3.4 2000-2012 1T3XT BVBA (AGPL-version)
  Impact:    HIGH - Different PDF generation library detected

⚠️  MAJOR DIFFERENCES (Likely to be detected):
────────────────────────────────────────────

Field: Font Roboto-Regular - Embedded
  Generated: yes
  Target:    false
  Impact:    HIGH - Embedded font status differs

...
```

---

## Step 7: Apply Enhanced Metadata

The metadata is now applied automatically when PDFs are generated. However, you can also manually apply it to existing PDFs:

```bash
# Apply target metadata to a PDF
node enhancedMetadataModifier.js test-generated.pdf test-modified.pdf --target targetMetadata.json

# Or set custom date
node enhancedMetadataModifier.js test-generated.pdf test-modified.pdf --date "2026-01-06"
```

---

## Step 8: Compare Again

After applying enhanced metadata:

```bash
node pdfMetadataComparator.js test-modified.pdf targetMetadata.json
```

**Expected Improvement:**
- ✅ Producer string will now match
- ✅ PDF version will match
- ✅ Dates can be set to match
- ❌ Font embedding will still differ (Puppeteer limitation)
- ❌ Internal structure will still differ (Puppeteer limitation)

---

## Understanding the Results

### Green Checks ✅ - Successfully Matched
These fields now match your target:
- Producer string
- PDF version
- Basic document properties
- Creation/modification dates

### Red X's ❌ - Cannot Match with Puppeteer
These cannot be fixed without changing PDF generation library:
- Font embedding flags
- Internal object structure
- Binary fingerprints
- Compression patterns

---

## Advanced: Custom Date Matching

To match specific dates from your target metadata:

```javascript
// Edit server.js, line ~966 in the /generate route
// Change this line:
await modifyKotakMetadata(tempPdfPath, metadataModifiedPath);

// To this (with custom date):
const targetDate = "2026-01-06T18:33:30+05:30"; // From your target metadata
await modifyKotakMetadata(tempPdfPath, metadataModifiedPath, targetDate);
```

---

## Troubleshooting

### Error: "pdfinfo: command not found"

Install poppler-utils:
```bash
sudo apt-get install poppler-utils
```

### Error: "Target metadata not found"

Make sure `targetMetadata.json` exists in the project root:
```bash
ls -la /home/user/kotak/targetMetadata.json
```

### PDFs Look Wrong (Missing Fonts)

Your font files are 0 bytes. Follow **Step 2** to download proper fonts.

### Metadata Still Shows "Chromium"

The enhanced metadata is only applied to the FINAL PDF, not the intermediate one. Make sure you're checking the downloaded PDF, not the temporary one.

### Want Exact Match

Read `METADATA_MATCHING_GUIDE.md` - you need to switch from Puppeteer to iText for exact matching.

---

## Testing Checklist

- [ ] Poppler-utils installed (`pdfinfo --version` works)
- [ ] Font files are NOT 0 bytes (`ls -lh public/fonts/`)
- [ ] Target metadata loaded (see console when starting server)
- [ ] Can generate PDF successfully
- [ ] Comparison tool runs without errors
- [ ] Producer string matches in comparison report
- [ ] Understand limitations (font embedding, internal structure)

---

## What to Expect

### With Current Setup (Puppeteer + Enhanced Metadata):

**✅ Will Match:**
- Producer string: `iText 5.3.4 2000-2012 1T3XT BVBA (AGPL-version)`
- PDF Version: `1.4`
- Creation/Mod dates: Can be customized
- No XMP metadata
- Not optimized/linearized

**❌ Will NOT Match:**
- Font embedding flags (Puppeteer always embeds)
- Internal object structure (Chrome vs iText)
- Binary fingerprints
- Compression patterns
- Object ID sequences

### Detection Risk:

| Verification Level | Pass/Fail |
|-------------------|-----------|
| Basic metadata check | ✅ PASS |
| Automated scanning | ⚠️ MAYBE (50/50) |
| Forensic analysis | ❌ FAIL |
| Expert review | ❌ FAIL |

---

## Next Steps

1. **For Testing/Development:**
   - Current setup is sufficient
   - Use enhanced metadata
   - Add watermarks ("TEST", "SAMPLE")

2. **For Better Matching:**
   - Read `METADATA_MATCHING_GUIDE.md`
   - Consider switching to iText
   - Rewrite PDF generation logic

3. **For Understanding:**
   - Generate multiple PDFs
   - Compare them all
   - Study the differences
   - Learn PDF forensics

---

## Important Reminders

⚠️ **This is for educational and legitimate purposes only**

- Don't use for fraud
- Don't use for loan applications with fake data
- Don't use for identity theft
- Don't use to deceive anyone

✅ **Legitimate uses:**
- Software testing
- UI/UX mockups (with watermarks)
- Learning PDF structure
- Security research (authorized)

---

## Support

If you encounter issues:

1. Check `METADATA_MATCHING_GUIDE.md` for detailed explanations
2. Run comparison tool to see specific differences
3. Verify all dependencies are installed
4. Check font files are not 0 bytes

For understanding what can/cannot be matched, read the comprehensive guide.
