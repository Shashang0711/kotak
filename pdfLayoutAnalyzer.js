// PDF Layout Analyzer
// Extracts exact design specifications from original PDF

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Extract detailed layout information from PDF
 * Requires: pdftotext, pdffonts, pdfinfo, pdftoppm
 */
function analyzeLayout(pdfPath) {
  console.log('Analyzing PDF layout...\n');

  const layout = {
    page: {},
    fonts: {},
    spacing: {},
    margins: {},
    content: {}
  };

  try {
    // 1. Get page dimensions and info
    const infoOutput = execSync(`pdfinfo "${pdfPath}"`, { encoding: 'utf8' });
    const pageSize = infoOutput.match(/Page size:\s+([0-9.]+) x ([0-9.]+) pts/);

    if (pageSize) {
      layout.page.width = parseFloat(pageSize[1]);
      layout.page.height = parseFloat(pageSize[2]);
      layout.page.widthMM = (layout.page.width * 0.352778).toFixed(2);
      layout.page.heightMM = (layout.page.height * 0.352778).toFixed(2);
      layout.page.format = layout.page.width === 595 && layout.page.height === 842 ? 'A4' : 'Custom';
    }

    // 2. Get font information with sizes
    const fontOutput = execSync(`pdffonts "${pdfPath}"`, { encoding: 'utf8' });
    layout.fonts.raw = fontOutput;
    layout.fonts.list = parseFontDetails(fontOutput);

    // 3. Extract text with layout preserved
    const textOutput = execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf8' });
    layout.content.text = textOutput;

    // 4. Analyze text positioning and spacing
    const bboxOutput = execSync(`pdftotext -bbox "${pdfPath}" -`, { encoding: 'utf8' });
    layout.spacing = analyzeSpacing(bboxOutput);

    // 5. Extract first page as image for visual reference
    try {
      execSync(`pdftoppm -png -f 1 -l 1 -r 150 "${pdfPath}" page_preview`, { encoding: 'utf8' });
      layout.preview = 'page_preview-1.png created';
    } catch (e) {
      layout.preview = 'Could not create preview image';
    }

    // 6. Detect margins by analyzing text boundaries
    layout.margins = detectMargins(bboxOutput);

    // 7. Analyze table structure
    layout.tables = analyzeTableStructure(textOutput);

  } catch (error) {
    console.error('Error analyzing layout:', error.message);
  }

  return layout;
}

/**
 * Parse font details from pdffonts output
 */
function parseFontDetails(fontOutput) {
  const fonts = [];
  const lines = fontOutput.split('\n').slice(2); // Skip header

  for (const line of lines) {
    if (line.trim()) {
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        fonts.push({
          name: parts[0],
          type: parts[1],
          encoding: parts[2],
          embedded: parts[3] === 'yes',
          subset: parts[4] === 'yes',
          unicode: parts[5] === 'yes'
        });
      }
    }
  }

  return fonts;
}

/**
 * Analyze spacing from bbox XML output
 */
function analyzeSpacing(bboxXml) {
  const spacing = {
    lineHeights: [],
    characterSpacing: [],
    paragraphSpacing: []
  };

  // Extract line heights from word positioning
  const wordMatches = [...bboxXml.matchAll(/<word xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">/g)];

  for (let i = 1; i < wordMatches.length; i++) {
    const prevY = parseFloat(wordMatches[i-1][2]);
    const currY = parseFloat(wordMatches[i][2]);
    const diff = Math.abs(currY - prevY);

    if (diff > 0.5 && diff < 50) { // Reasonable line height
      spacing.lineHeights.push(diff.toFixed(2));
    }
  }

  // Calculate average line height
  if (spacing.lineHeights.length > 0) {
    const avgLineHeight = spacing.lineHeights.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / spacing.lineHeights.length;
    spacing.averageLineHeight = avgLineHeight.toFixed(2);
  }

  return spacing;
}

/**
 * Detect margins from text boundaries
 */
function detectMargins(bboxXml) {
  const margins = {
    top: null,
    bottom: null,
    left: null,
    right: null
  };

  const wordMatches = [...bboxXml.matchAll(/<word xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">/g)];

  if (wordMatches.length > 0) {
    // Find minimum and maximum positions
    const xMins = wordMatches.map(m => parseFloat(m[1]));
    const yMins = wordMatches.map(m => parseFloat(m[2]));
    const xMaxs = wordMatches.map(m => parseFloat(m[3]));
    const yMaxs = wordMatches.map(m => parseFloat(m[4]));

    margins.left = Math.min(...xMins).toFixed(2);
    margins.top = Math.min(...yMins).toFixed(2);
    margins.right = (595 - Math.max(...xMaxs)).toFixed(2); // Assuming A4 width
    margins.bottom = (842 - Math.max(...yMaxs)).toFixed(2); // Assuming A4 height
  }

  return margins;
}

/**
 * Analyze table structure from text
 */
function analyzeTableStructure(text) {
  const tables = {
    detected: false,
    columnCount: 0,
    estimatedColumns: []
  };

  // Look for table-like patterns (multiple spaces indicating columns)
  const lines = text.split('\n');
  const potentialTableLines = lines.filter(line => {
    const spaces = line.match(/\s{3,}/g);
    return spaces && spaces.length >= 2;
  });

  if (potentialTableLines.length > 5) {
    tables.detected = true;

    // Estimate column positions
    const firstTableLine = potentialTableLines[0];
    const columnPositions = [];
    let pos = 0;

    for (let i = 0; i < firstTableLine.length; i++) {
      if (firstTableLine[i] !== ' ' && (i === 0 || firstTableLine[i-1] === ' ')) {
        columnPositions.push(i);
      }
    }

    tables.columnCount = columnPositions.length;
    tables.estimatedColumns = columnPositions;
  }

  return tables;
}

/**
 * Generate CSS specifications from layout analysis
 */
function generateCSSSpecs(layout) {
  const css = {
    page: `
/* Page Setup - Exact A4 dimensions */
@page {
  size: ${layout.page.width}pt ${layout.page.height}pt;
  margin: 0;
}

body {
  width: ${layout.page.width}pt;
  height: ${layout.page.height}pt;
  margin: 0;
  padding: 0;
}

.page {
  width: ${layout.page.width}pt;
  height: ${layout.page.height}pt;
  padding-top: ${layout.margins.top}pt;
  padding-bottom: ${layout.margins.bottom}pt;
  padding-left: ${layout.margins.left}pt;
  padding-right: ${layout.margins.right}pt;
  box-sizing: border-box;
}`,
    fonts: '',
    spacing: `
/* Line Height and Spacing */
.content {
  line-height: ${layout.spacing.averageLineHeight}pt;
}

p {
  margin: 0;
  padding: 0;
}`
  };

  // Generate font-face declarations
  layout.fonts.list.forEach(font => {
    if (!font.embedded) {
      css.fonts += `
/* Font: ${font.name} */
/* Type: ${font.type}, Encoding: ${font.encoding} */
/* Embedded: ${font.embedded}, Subset: ${font.subset} */
`;
    }
  });

  return css;
}

/**
 * Generate detailed report
 */
function generateReport(layout) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('              PDF LAYOUT ANALYSIS REPORT               ');
  console.log('═══════════════════════════════════════════════════════\n');

  // Page dimensions
  console.log('📄 PAGE DIMENSIONS');
  console.log('─────────────────────────────────────────────────────');
  console.log(`Format:     ${layout.page.format}`);
  console.log(`Width:      ${layout.page.width} pt (${layout.page.widthMM} mm)`);
  console.log(`Height:     ${layout.page.height} pt (${layout.page.heightMM} mm)`);
  console.log('');

  // Margins
  console.log('📏 MARGINS (in points)');
  console.log('─────────────────────────────────────────────────────');
  console.log(`Top:        ${layout.margins.top} pt`);
  console.log(`Bottom:     ${layout.margins.bottom} pt`);
  console.log(`Left:       ${layout.margins.left} pt`);
  console.log(`Right:      ${layout.margins.right} pt`);
  console.log('');

  // Fonts
  console.log('🔤 FONTS');
  console.log('─────────────────────────────────────────────────────');
  layout.fonts.list.forEach((font, idx) => {
    console.log(`${idx + 1}. ${font.name}`);
    console.log(`   Type: ${font.type} | Encoding: ${font.encoding}`);
    console.log(`   Embedded: ${font.embedded} | Subset: ${font.subset} | Unicode: ${font.unicode}`);
    console.log('');
  });

  // Spacing
  console.log('📐 SPACING');
  console.log('─────────────────────────────────────────────────────');
  console.log(`Average Line Height: ${layout.spacing.averageLineHeight} pt`);
  console.log('');

  // Tables
  console.log('📊 TABLE STRUCTURE');
  console.log('─────────────────────────────────────────────────────');
  console.log(`Tables Detected:  ${layout.tables.detected ? 'Yes' : 'No'}`);
  if (layout.tables.detected) {
    console.log(`Column Count:     ${layout.tables.columnCount}`);
    console.log(`Column Positions: ${layout.tables.estimatedColumns.join(', ')}`);
  }
  console.log('');

  // Preview
  console.log('🖼️  VISUAL PREVIEW');
  console.log('─────────────────────────────────────────────────────');
  console.log(layout.preview);
  console.log('');

  console.log('═══════════════════════════════════════════════════════\n');
}

/**
 * Save layout specifications to JSON
 */
function saveLayoutSpec(layout, outputPath) {
  const spec = {
    timestamp: new Date().toISOString(),
    page: layout.page,
    margins: layout.margins,
    fonts: layout.fonts.list,
    spacing: layout.spacing,
    tables: layout.tables
  };

  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✓ Layout specifications saved to: ${outputPath}\n`);
}

/**
 * Save CSS template
 */
function saveCSSTemplate(layout, outputPath) {
  const css = generateCSSSpecs(layout);
  const template = `/* Generated CSS from PDF Layout Analysis */
/* Source: ${new Date().toISOString()} */

${css.page}

${css.fonts}

${css.spacing}

/* Additional styling as needed */
`;

  fs.writeFileSync(outputPath, template);
  console.log(`✓ CSS template saved to: ${outputPath}\n`);
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node pdfLayoutAnalyzer.js <pdf-path> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --save-spec <file.json>    Save layout specifications to JSON');
    console.log('  --save-css <file.css>      Save CSS template');
    console.log('  --preview                  Create preview image');
    console.log('');
    console.log('Examples:');
    console.log('  node pdfLayoutAnalyzer.js original.pdf');
    console.log('  node pdfLayoutAnalyzer.js original.pdf --save-spec layout.json --save-css template.css');
    process.exit(1);
  }

  const pdfPath = args[0];
  let saveSpecPath = null;
  let saveCssPath = null;

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--save-spec' && args[i + 1]) {
      saveSpecPath = args[i + 1];
      i++;
    } else if (args[i] === '--save-css' && args[i + 1]) {
      saveCssPath = args[i + 1];
      i++;
    }
  }

  // Check if PDF exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  // Analyze layout
  const layout = analyzeLayout(pdfPath);

  // Generate report
  generateReport(layout);

  // Save specs if requested
  if (saveSpecPath) {
    saveLayoutSpec(layout, saveSpecPath);
  }

  if (saveCssPath) {
    saveCSSTemplate(layout, saveCssPath);
  }

  console.log('💡 NEXT STEPS:');
  console.log('─────────────────────────────────────────────────────');
  console.log('1. Compare this layout with your generated PDF');
  console.log('2. Update views/statement.ejs with exact margins/spacing');
  console.log('3. Adjust CSS to match font sizes and line heights');
  console.log('4. Use page_preview-1.png as visual reference');
  console.log('');
}

module.exports = {
  analyzeLayout,
  generateCSSSpecs,
  generateReport
};
