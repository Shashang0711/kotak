# Visual Layout Matching Guide

## Goal: Pixel-Perfect Design Replication

This guide helps you create PDFs that are **visually identical** to the original bank statement - matching fonts, spacing, margins, layout, and styling.

---

## Quick Start Workflow

```bash
# Step 1: Analyze the original PDF
node pdfLayoutAnalyzer.js original_statement.pdf --save-spec original_layout.json --save-css original_styles.css

# Step 2: Generate a test PDF from your app
# (Use the web interface to generate a PDF)

# Step 3: Compare layouts
node visualComparator.js original_statement.pdf generated_test.pdf --save-fixes layout_fixes.json

# Step 4: Apply fixes to views/statement.ejs

# Step 5: Repeat steps 2-4 until perfect match
```

---

## What You're Matching

### 1. Page Dimensions ✅ EASY
```css
@page {
  size: 595pt 842pt; /* A4 in points */
  margin: 0;
}
```

### 2. Margins & Padding ✅ EASY
From your target (extract with analyzer):
```css
.page {
  padding-top: 36pt;
  padding-bottom: 36pt;
  padding-left: 40pt;
  padding-right: 40pt;
}
```

### 3. Fonts ⚠️ MEDIUM
```css
@font-face {
  font-family: 'Roboto';
  src: url('/fonts/Roboto-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
}

body {
  font-family: 'Roboto', sans-serif;
  font-size: 9pt; /* Adjust based on original */
  font-weight: 400;
}
```

### 4. Line Heights & Spacing ⚠️ MEDIUM
```css
.transaction-row {
  line-height: 14pt; /* Extract from analyzer */
}

.section-gap {
  margin-top: 20pt;
  margin-bottom: 10pt;
}
```

### 5. Table Layout ⚠️ MEDIUM
```css
.transaction-table {
  width: 100%;
  border-collapse: collapse;
}

.transaction-table td {
  padding: 4pt 8pt;
  vertical-align: top;
}
```

### 6. Logo & Images ✅ EASY
```html
<img src="logo.png"
     width="200px"
     height="59px"
     style="display: block;" />
```

---

## Step-by-Step Guide

### Step 1: Extract Original Layout Specifications

Run the layout analyzer on your original PDF:

```bash
node pdfLayoutAnalyzer.js original_statement.pdf \
  --save-spec original_layout.json \
  --save-css original_styles.css
```

**Output:**
- `original_layout.json` - All measurements in JSON format
- `original_styles.css` - CSS template with extracted values
- `page_preview-1.png` - Visual reference of first page

**Review the report** to see:
- Exact page dimensions
- Margin measurements (top, bottom, left, right)
- Font list with types and encoding
- Average line height
- Table structure detection

### Step 2: Identify Key Measurements

Open `original_layout.json` and note these critical values:

```json
{
  "page": {
    "width": 595,
    "height": 842,
    "format": "A4"
  },
  "margins": {
    "top": "40.50",
    "bottom": "45.20",
    "left": "38.75",
    "right": "42.10"
  },
  "fonts": [
    { "name": "Roboto-Light", "type": "TrueType", "encoding": "WinAnsi" },
    { "name": "Roboto-Regular", "type": "TrueType", "encoding": "WinAnsi" },
    { "name": "Roboto-Medium", "type": "TrueType", "encoding": "WinAnsi" },
    { "name": "Roboto-Bold", "type": "TrueType", "encoding": "WinAnsi" }
  ],
  "spacing": {
    "averageLineHeight": "13.5"
  }
}
```

### Step 3: Update Your Template

Edit `views/statement.ejs` to match these exact values.

#### 3a. Page Setup

```html
<style>
@page {
  size: 595pt 842pt; /* Exact A4 dimensions from analysis */
  margin: 0;
}

body {
  width: 595pt;
  height: 842pt;
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
  font-size: 9pt; /* Adjust based on content */
}
</style>
```

#### 3b. Container with Exact Margins

```html
<style>
.page-container {
  width: 595pt;
  min-height: 842pt;
  padding-top: 40.50pt;    /* From analysis */
  padding-bottom: 45.20pt;  /* From analysis */
  padding-left: 38.75pt;    /* From analysis */
  padding-right: 42.10pt;   /* From analysis */
  box-sizing: border-box;
}
</style>
```

#### 3c. Font Specifications

```html
<style>
/* Exact font weights from original */
.header-title {
  font-family: 'Roboto', sans-serif;
  font-weight: 700; /* Bold */
  font-size: 14pt;
}

.account-info {
  font-family: 'Roboto', sans-serif;
  font-weight: 400; /* Regular */
  font-size: 9pt;
}

.transaction-text {
  font-family: 'Roboto', sans-serif;
  font-weight: 300; /* Light */
  font-size: 8pt;
  line-height: 13.5pt; /* From analysis */
}
</style>
```

#### 3d. Table Layout

```html
<style>
.transaction-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20pt;
}

.transaction-table thead th {
  font-weight: 500; /* Medium */
  font-size: 9pt;
  text-align: left;
  padding: 6pt 8pt;
  border-bottom: 1pt solid #000;
}

.transaction-table tbody td {
  font-weight: 400; /* Regular */
  font-size: 8pt;
  padding: 4pt 8pt;
  vertical-align: top;
  line-height: 13.5pt;
}

/* Column widths - measure from original */
.col-date { width: 80pt; }
.col-description { width: 240pt; }
.col-ref { width: 100pt; }
.col-debit { width: 70pt; text-align: right; }
.col-credit { width: 70pt; text-align: right; }
.col-balance { width: 80pt; text-align: right; }
</style>
```

### Step 4: Generate Test PDF

1. Start your server: `npm start`
2. Fill in the form with test data
3. Generate and download PDF
4. Save as `generated_test.pdf`

### Step 5: Compare Layouts

```bash
node visualComparator.js original_statement.pdf generated_test.pdf --save-fixes fixes.json
```

**Review the report:**
- 🚨 **CRITICAL**: Must fix immediately (page size, major layout issues)
- ⚠️ **HIGH**: Visible differences (margins, font sizes)
- 📊 **MEDIUM**: Noticeable differences (spacing, alignment)
- ℹ️ **LOW**: Minor differences (may be acceptable)

**Check generated images:**
- `comparison_original-1.png` - Original first page
- `comparison_generated-1.png` - Generated first page
- `comparison_diff.png` - Difference visualization (if ImageMagick installed)

### Step 6: Apply Fixes

Review `fixes.json` for specific corrections:

```json
[
  {
    "type": "MARGIN_TOP",
    "severity": "HIGH",
    "cssProperty": "padding-top",
    "value": "40.50pt",
    "fullFix": "Update CSS: padding-top: 40.50pt"
  },
  {
    "type": "LINE_HEIGHT",
    "severity": "MEDIUM",
    "cssProperty": "line-height",
    "value": "13.5pt",
    "fullFix": "Update CSS: line-height: 13.5pt"
  }
]
```

Apply each fix to `views/statement.ejs`.

### Step 7: Iterate

Repeat steps 4-6 until all differences are resolved.

---

## Common Issues & Fixes

### Issue 1: Margins Don't Match

**Symptom:** Content too close/far from edges

**Fix:**
```css
/* Measure exact margins from original_layout.json */
.page-container {
  padding-top: 40.50pt;    /* Adjust these */
  padding-bottom: 45.20pt;
  padding-left: 38.75pt;
  padding-right: 42.10pt;
}
```

**Test:** Compare preview images side-by-side

### Issue 2: Font Size Wrong

**Symptom:** Text appears larger/smaller than original

**Fix:**
```css
/* Measure font sizes from original PDF */
body {
  font-size: 9pt; /* Base font size */
}

.transaction-row {
  font-size: 8pt; /* Transaction details */
}

.header {
  font-size: 14pt; /* Headers */
}
```

**Tool:** Use PDF reader zoom at 100% to measure text height

### Issue 3: Line Spacing Too Tight/Loose

**Symptom:** Rows appear compressed or spread out

**Fix:**
```css
.transaction-table tbody td {
  line-height: 13.5pt; /* Use value from analyzer */
  padding: 4pt 8pt;    /* Adjust vertical padding */
}
```

**Test:** Count how many rows fit on one page (should match original)

### Issue 4: Table Columns Misaligned

**Symptom:** Columns don't line up with original

**Fix:**
```css
/* Measure column widths from original */
.col-date { width: 80pt; }
.col-description { width: 240pt; }
.col-ref { width: 100pt; }
.col-debit { width: 70pt; }
.col-credit { width: 70pt; }
.col-balance { width: 80pt; }

/* Ensure total equals content width */
/* Total: 80+240+100+70+70+80 = 640pt */
/* Content width = 595pt - 38.75pt - 42.10pt = 514.15pt */
/* Adjust proportionally */
```

**Tool:** Open both PDFs in viewer, measure pixel positions

### Issue 5: Logo Size/Position Wrong

**Symptom:** Logo appears different size or position

**Fix:**
```html
<img src="/images/kotak-logo.png"
     width="200"
     height="59"
     style="display: block; margin-bottom: 10pt;" />
```

**From analyzer:** Logo should be 200x59 pixels at 144 DPI (page 1) or 212 DPI (other pages)

### Issue 6: Text Wrapping Differently

**Symptom:** Lines break at different points

**Fix:**
```css
/* Ensure exact character spacing */
.transaction-description {
  width: 240pt;        /* Fixed width */
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: none;       /* Disable hyphenation */
  letter-spacing: 0;   /* No extra spacing */
}
```

**Test:** Compare specific long transactions

### Issue 7: Page Breaks at Wrong Places

**Symptom:** Content splits across pages differently

**Fix:**
```css
/* Control page breaks */
.transaction-row {
  page-break-inside: avoid;  /* Keep rows together */
}

.page-container {
  page-break-after: always;  /* Force page break */
}

/* Ensure exact page height */
.page-container {
  height: 842pt;  /* A4 height */
  box-sizing: border-box;
}
```

### Issue 8: Font Weight Looks Different

**Symptom:** Text appears bolder/lighter than original

**Fix:**
```css
/* Use exact font weights from original */
.light-text {
  font-weight: 300;  /* Roboto-Light */
}

.regular-text {
  font-weight: 400;  /* Roboto-Regular */
}

.medium-text {
  font-weight: 500;  /* Roboto-Medium */
}

.bold-text {
  font-weight: 700;  /* Roboto-Bold */
}
```

**Check:** Ensure font files are correct (not 0 bytes!)

---

## Advanced: Puppeteer PDF Options

Update the Puppeteer configuration in `server.js` around line 938:

```javascript
const pdfBuffer = await page.pdf({
  format: 'A4',                           // Standard A4
  width: '595pt',                         // Exact width in points
  height: '842pt',                        // Exact height in points
  margin: {
    top: '0',
    bottom: '0',
    left: '0',
    right: '0'
  },                                      // No browser margins
  printBackground: true,                  // Include backgrounds
  preferCSSPageSize: true,                // Use @page CSS rules
  displayHeaderFooter: false,             // No header/footer
  scale: 1.0,                             // No scaling
  pageRanges: '',                         // All pages
  omitBackground: false                   // Include page background
});
```

---

## Measuring Tools & Techniques

### Tool 1: PDF Viewer Measurement

Most PDF viewers have rulers:
1. Open PDF at 100% zoom
2. Enable rulers (View → Rulers)
3. Measure distances in points/mm
4. Note exact positions

### Tool 2: Screenshot Overlay

1. Take screenshot of original at exact DPI
2. Take screenshot of generated at same DPI
3. Layer in image editor (GIMP, Photoshop)
4. Set top layer to 50% opacity
5. Visually compare alignment

### Tool 3: Difference Image

```bash
# Create difference image (requires ImageMagick)
convert original.png generated.png -compose difference -composite diff.png

# White = identical
# Colored = differences
```

### Tool 4: Text Extraction Comparison

```bash
# Extract text with layout
pdftotext -layout original.pdf original.txt
pdftotext -layout generated.pdf generated.txt

# Compare line by line
diff -y original.txt generated.txt | less
```

---

## Verification Checklist

Before finalizing, verify each of these:

### Page Layout
- [ ] Page size exactly 595 x 842 points
- [ ] Top margin matches (±1pt)
- [ ] Bottom margin matches (±1pt)
- [ ] Left margin matches (±1pt)
- [ ] Right margin matches (±1pt)

### Typography
- [ ] All 4 Roboto font files loaded correctly (not 0 bytes)
- [ ] Font sizes match original
- [ ] Font weights match (Light/Regular/Medium/Bold)
- [ ] Line heights match
- [ ] Letter spacing matches (usually 0)

### Layout Elements
- [ ] Logo size exactly 200x59px
- [ ] Logo position matches
- [ ] Header layout identical
- [ ] Account info section spacing matches
- [ ] Transaction table column widths match
- [ ] Table row heights match

### Spacing & Alignment
- [ ] All section gaps match
- [ ] Table header padding matches
- [ ] Table cell padding matches
- [ ] Text alignment (left/right) correct
- [ ] Vertical centering correct

### Content per Page
- [ ] Same number of transactions fit on page 1
- [ ] Page breaks occur at same places
- [ ] Footer position matches
- [ ] Totals/summaries in same positions

### Visual Consistency
- [ ] comparison_diff.png shows minimal differences
- [ ] Side-by-side images look identical at 100% zoom
- [ ] Border styles match (if any)
- [ ] Background colors match
- [ ] Overall "feel" is identical

---

## Expected Results

### Perfect Match Scenario:
```bash
$ node visualComparator.js original.pdf generated.pdf

Comparing PDF layouts...
Analyzing original PDF...
Analyzing generated PDF...

═══════════════════════════════════════════════════════
           VISUAL LAYOUT COMPARISON REPORT
═══════════════════════════════════════════════════════

✓ Perfect match! No layout differences detected.

═══════════════════════════════════════════════════════
```

### Acceptable Differences:
- Metadata differences (Producer, dates) - handled separately
- Font embedding flags - cannot match with Puppeteer
- Internal PDF structure - cosmetic, not visual

### Unacceptable Differences:
- Margins off by >2pt
- Font sizes different
- Line heights off by >1pt
- Column misalignment
- Logo wrong size
- Content spacing noticeably different

---

## Troubleshooting

### Problem: Fonts render differently even with correct sizes

**Cause:** Font files are 0 bytes or wrong encoding

**Solution:**
```bash
# Download proper Roboto fonts
wget https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip
unzip roboto-unhinted.zip
cp roboto-unhinted/Roboto-*.ttf public/fonts/

# Verify
ls -lh public/fonts/
# Should show file sizes like 159K, 168K, etc. (NOT 0)
```

### Problem: Margins look right in browser preview but wrong in PDF

**Cause:** Puppeteer adds its own margins

**Solution:**
```javascript
// In server.js, ensure margin is explicitly 0
const pdfBuffer = await page.pdf({
  format: 'A4',
  margin: { top: '0', bottom: '0', left: '0', right: '0' }, // Critical!
  preferCSSPageSize: true
});
```

### Problem: Content overflows to next page unexpectedly

**Cause:** Heights not calculated correctly

**Solution:**
```css
/* Set explicit page height */
.page-container {
  height: 842pt;
  overflow: hidden; /* Prevent overflow */
}

/* Calculate content area */
/* 842pt - 40.50pt (top) - 45.20pt (bottom) = 756.30pt available */
```

### Problem: Table columns don't align properly

**Cause:** Column widths not fixed

**Solution:**
```css
/* Use table-layout: fixed for precise control */
.transaction-table {
  width: 100%;
  table-layout: fixed; /* Critical for column control */
  border-collapse: collapse;
}

/* Set explicit widths on first row */
.transaction-table thead th:nth-child(1) { width: 80pt; }
.transaction-table thead th:nth-child(2) { width: 240pt; }
/* etc. */
```

---

## Automation Script

Create a quick comparison script:

```bash
#!/bin/bash
# compare-layout.sh

echo "Generating test PDF..."
# Trigger PDF generation via curl or manual step

echo "Comparing layouts..."
node visualComparator.js original_statement.pdf generated_test.pdf

echo "Opening comparison images..."
xdg-open comparison_original-1.png &
xdg-open comparison_generated-1.png &

echo "Done! Review the images side-by-side."
```

---

## Final Notes

**Visual matching is iterative:**
1. Analyze → Compare → Fix → Repeat
2. Start with big issues (page size, margins)
3. Then fix medium issues (fonts, spacing)
4. Finally tweak minor issues (alignment, padding)

**Tools provided:**
- `pdfLayoutAnalyzer.js` - Extract specs from original
- `visualComparator.js` - Compare two PDFs
- `original_layout.json` - Reference measurements
- `fixes.json` - Actionable corrections

**Expected time to perfect match:**
- Initial setup: 30 minutes
- First iteration: 1-2 hours
- Refinement: 2-3 iterations
- Total: 3-5 hours for pixel-perfect match

**When you achieve perfect match:**
- comparison_diff.png will be almost completely white
- Side-by-side images indistinguishable at 100% zoom
- Same number of rows per page
- Text alignment perfect
- Spacing identical

Good luck! 🎯
