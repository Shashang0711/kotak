# Quick Reference: PDF Visual Matching

## 🚀 Fast Track (Have original PDF?)

```bash
# 1. Analyze original PDF (REQUIRED - do this first!)
node pdfLayoutAnalyzer.js your_original.pdf --save-spec layout.json --save-css styles.css

# 2. Fix fonts (if 0 bytes)
wget https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip
unzip roboto-unhinted.zip && cp roboto-unhinted/*.ttf public/fonts/

# 3. Generate test PDF from web interface
npm start
# Visit http://localhost:3000, fill form, generate PDF

# 4. Compare
node visualComparator.js your_original.pdf generated_test.pdf --save-fixes fixes.json

# 5. Apply fixes to views/statement.ejs (see report)

# 6. Repeat 3-5 until perfect
```

---

## 📊 What Each Tool Does

| Tool | Purpose | Output |
|------|---------|--------|
| `pdfLayoutAnalyzer.js` | Extract design specs from original | Margins, fonts, spacing, preview image |
| `visualComparator.js` | Compare two PDFs visually | Differences report, side-by-side images |
| `pdfMetadataComparator.js` | Compare metadata | Producer, fonts, encryption status |
| `enhancedMetadataModifier.js` | Apply metadata to PDF | Modified PDF with target metadata |

---

## 📏 Key Measurements to Match

### From Original PDF Analysis:

```
Page Size:      595 x 842 pt (A4)
Margins:        Top/Bottom/Left/Right in points
Fonts:          Roboto family (Light/Regular/Medium/Bold)
Line Height:    Average spacing between lines
Column Widths:  Transaction table columns
```

### Apply to statement.ejs:

```css
@page {
  size: 595pt 842pt;
  margin: 0;
}

.page-container {
  padding-top: [FROM_ANALYSIS]pt;
  padding-left: [FROM_ANALYSIS]pt;
  /* ... */
}
```

---

## 🎯 Success Criteria

### ✅ Perfect Match:
- comparison_diff.png is mostly white
- Same content per page
- Text aligns pixel-perfect
- Spacing identical

### ⚠️ Good Enough:
- Margins within 2pt
- Font sizes match
- Visual appearance nearly identical
- Minor spacing differences (<1pt)

### ❌ Needs Work:
- Margins off by >5pt
- Wrong font sizes
- Content overflows differently
- Obvious visual differences

---

## 🔧 Common CSS Fixes

```css
/* Fix margins */
.page-container {
  padding-top: 40.5pt;    /* From analyzer */
  padding-bottom: 45.2pt;
  padding-left: 38.75pt;
  padding-right: 42.1pt;
}

/* Fix line height */
.transaction-row {
  line-height: 13.5pt;   /* From analyzer */
}

/* Fix font size */
body {
  font-size: 9pt;        /* Base size */
}

/* Fix table columns */
.col-date { width: 80pt; }
.col-description { width: 240pt; }
.col-amount { width: 70pt; }
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Margins wrong | Update .page-container padding |
| Text too big/small | Adjust font-size |
| Lines too tight | Increase line-height |
| Columns misaligned | Set fixed widths with table-layout: fixed |
| Fonts look wrong | Check font files not 0 bytes |
| Page breaks wrong | Add page-break-inside: avoid |

---

## 📱 Dependencies

```bash
# Required for analysis tools
sudo apt-get install poppler-utils

# Optional for difference images
sudo apt-get install imagemagick

# Verify
pdfinfo --version
pdffonts --version
pdftoppm --version
```

---

## 📂 Generated Files

| File | Description |
|------|-------------|
| `layout.json` | Layout specifications from original |
| `styles.css` | CSS template extracted |
| `fixes.json` | List of corrections needed |
| `page_preview-1.png` | Visual reference of original |
| `comparison_original-1.png` | Original first page |
| `comparison_generated-1.png` | Generated first page |
| `comparison_diff.png` | Difference visualization |

---

## 🎬 Complete Example

```bash
# Starting from scratch
cd /home/user/kotak

# 1. Install dependencies
sudo apt-get install poppler-utils imagemagick

# 2. Fix fonts
wget https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip
unzip roboto-unhinted.zip
cp roboto-unhinted/*.ttf public/fonts/
rm -rf roboto-unhinted.zip roboto-unhinted/

# 3. Analyze your original statement PDF
node pdfLayoutAnalyzer.js ~/Downloads/bank_statement.pdf \
  --save-spec original_layout.json \
  --save-css original_styles.css

# 4. Review the analysis
cat original_layout.json
# Note the margins, fonts, and spacing values

# 5. Edit views/statement.ejs
# Update CSS with values from original_layout.json

# 6. Start server and generate test PDF
npm start
# Go to http://localhost:3000, generate PDF

# 7. Compare
node visualComparator.js ~/Downloads/bank_statement.pdf ./test-generated.pdf

# 8. Review comparison images
xdg-open comparison_original-1.png &
xdg-open comparison_generated-1.png &
xdg-open comparison_diff.png &

# 9. Apply suggested fixes to statement.ejs

# 10. Repeat steps 6-9 until satisfied
```

---

## 📖 Full Documentation

- **VISUAL_MATCHING_GUIDE.md** - Complete guide with all details
- **METADATA_MATCHING_GUIDE.md** - Metadata & forensics
- **SETUP_INSTRUCTIONS.md** - Initial setup
- **PROJECT_ANALYSIS.md** - Full project analysis

---

## 💡 Pro Tips

1. **Start with analyzer** - Don't guess measurements
2. **Fix fonts first** - 0-byte files won't render
3. **Compare iteratively** - Don't expect perfect first try
4. **Use 100% zoom** - View PDFs at actual size
5. **Check all pages** - Not just first page
6. **Measure twice** - Verify critical dimensions
7. **Test with real data** - Similar transaction count

---

## ⚡ One-Liner Comparison

```bash
# Quick compare after each generation
node visualComparator.js original.pdf latest.pdf && xdg-open comparison_diff.png
```

---

## 📞 Help

**If analyzer fails:**
- Check `pdfinfo --version` works
- Verify PDF path is correct
- Try with different PDF

**If comparison shows no images:**
- Install pdftoppm: `sudo apt-get install poppler-utils`
- Check PDF paths are correct

**If fonts look wrong:**
- Verify fonts not 0 bytes: `ls -lh public/fonts/`
- Download proper Roboto fonts
- Clear browser cache

**If margins still wrong:**
- Double-check analyzer output
- Ensure Puppeteer margin is 0
- Verify box-sizing: border-box

---

## 🎯 Final Checklist

Before considering "done":

- [ ] Ran pdfLayoutAnalyzer on original
- [ ] Fixed 0-byte font files
- [ ] Applied margins from analysis
- [ ] Set correct line heights
- [ ] Fixed font sizes
- [ ] Aligned table columns
- [ ] comparison_diff.png mostly white
- [ ] Same rows per page
- [ ] All pages checked (not just first)
- [ ] Real data tested

---

**Expected time: 3-5 hours for pixel-perfect match**

Good luck! 🚀
