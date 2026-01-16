// Visual PDF Comparator
// Compares two PDFs side-by-side to identify layout differences

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Compare two PDFs visually
 */
function compareVisualLayout(originalPdf, generatedPdf) {
  console.log('Comparing PDF layouts...\n');

  const comparison = {
    original: {},
    generated: {},
    differences: []
  };

  try {
    // Extract layout from both PDFs
    console.log('Analyzing original PDF...');
    comparison.original = extractLayoutData(originalPdf);

    console.log('Analyzing generated PDF...');
    comparison.generated = extractLayoutData(generatedPdf);

    // Compare dimensions
    if (comparison.original.page.width !== comparison.generated.page.width ||
        comparison.original.page.height !== comparison.generated.page.height) {
      comparison.differences.push({
        type: 'PAGE_SIZE',
        severity: 'CRITICAL',
        original: `${comparison.original.page.width} x ${comparison.original.page.height}`,
        generated: `${comparison.generated.page.width} x ${comparison.generated.page.height}`,
        fix: 'Update Puppeteer PDF options to match exact page size'
      });
    }

    // Compare margins
    const marginDiff = compareMargins(comparison.original.margins, comparison.generated.margins);
    if (marginDiff.length > 0) {
      comparison.differences.push(...marginDiff);
    }

    // Compare fonts
    const fontDiff = compareFonts(comparison.original.fonts, comparison.generated.fonts);
    if (fontDiff.length > 0) {
      comparison.differences.push(...fontDiff);
    }

    // Compare spacing
    const spacingDiff = compareSpacing(comparison.original.spacing, comparison.generated.spacing);
    if (spacingDiff.length > 0) {
      comparison.differences.push(...spacingDiff);
    }

    // Create side-by-side comparison images
    console.log('\nCreating visual comparison images...');
    createVisualComparison(originalPdf, generatedPdf);

  } catch (error) {
    console.error('Error comparing layouts:', error.message);
  }

  return comparison;
}

/**
 * Extract layout data from PDF
 */
function extractLayoutData(pdfPath) {
  const layout = {
    page: {},
    margins: {},
    fonts: [],
    spacing: {}
  };

  // Get page info
  const infoOutput = execSync(`pdfinfo "${pdfPath}"`, { encoding: 'utf8' });
  const pageSize = infoOutput.match(/Page size:\s+([0-9.]+) x ([0-9.]+) pts/);
  if (pageSize) {
    layout.page.width = parseFloat(pageSize[1]);
    layout.page.height = parseFloat(pageSize[2]);
  }

  // Get fonts
  const fontOutput = execSync(`pdffonts "${pdfPath}"`, { encoding: 'utf8' });
  const fontLines = fontOutput.split('\n').slice(2);
  for (const line of fontLines) {
    if (line.trim()) {
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        layout.fonts.push({
          name: parts[0],
          type: parts[1],
          encoding: parts[2]
        });
      }
    }
  }

  // Get margins from text positioning
  try {
    const bboxOutput = execSync(`pdftotext -bbox "${pdfPath}" -`, { encoding: 'utf8' });
    const wordMatches = [...bboxOutput.matchAll(/<word xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">/g)];

    if (wordMatches.length > 0) {
      const xMins = wordMatches.map(m => parseFloat(m[1]));
      const yMins = wordMatches.map(m => parseFloat(m[2]));
      const xMaxs = wordMatches.map(m => parseFloat(m[3]));
      const yMaxs = wordMatches.map(m => parseFloat(m[4]));

      layout.margins.left = Math.min(...xMins).toFixed(2);
      layout.margins.top = Math.min(...yMins).toFixed(2);
      layout.margins.right = (layout.page.width - Math.max(...xMaxs)).toFixed(2);
      layout.margins.bottom = (layout.page.height - Math.max(...yMaxs)).toFixed(2);

      // Calculate average line height
      const lineHeights = [];
      for (let i = 1; i < wordMatches.length; i++) {
        const prevY = parseFloat(wordMatches[i-1][2]);
        const currY = parseFloat(wordMatches[i][2]);
        const diff = Math.abs(currY - prevY);
        if (diff > 0.5 && diff < 50) {
          lineHeights.push(diff);
        }
      }

      if (lineHeights.length > 0) {
        layout.spacing.averageLineHeight = (lineHeights.reduce((a, b) => a + b, 0) / lineHeights.length).toFixed(2);
      }
    }
  } catch (e) {
    console.log('Could not extract detailed positioning');
  }

  return layout;
}

/**
 * Compare margins
 */
function compareMargins(orig, gen) {
  const diffs = [];
  const tolerance = 2.0; // 2pt tolerance

  ['top', 'bottom', 'left', 'right'].forEach(side => {
    const origVal = parseFloat(orig[side] || 0);
    const genVal = parseFloat(gen[side] || 0);
    const diff = Math.abs(origVal - genVal);

    if (diff > tolerance) {
      diffs.push({
        type: `MARGIN_${side.toUpperCase()}`,
        severity: diff > 5 ? 'HIGH' : 'MEDIUM',
        original: `${origVal.toFixed(2)}pt`,
        generated: `${genVal.toFixed(2)}pt`,
        difference: `${diff.toFixed(2)}pt`,
        fix: `Update CSS: padding-${side}: ${origVal.toFixed(2)}pt`
      });
    }
  });

  return diffs;
}

/**
 * Compare fonts
 */
function compareFonts(origFonts, genFonts) {
  const diffs = [];
  const origNames = origFonts.map(f => f.name.replace(/^[A-Z]{6}\+/, '')); // Remove subset prefix
  const genNames = genFonts.map(f => f.name.replace(/^[A-Z]{6}\+/, ''));

  // Check if all original fonts are present
  origNames.forEach(name => {
    if (!genNames.includes(name) && !name.includes('+')) {
      diffs.push({
        type: 'FONT_MISSING',
        severity: 'HIGH',
        original: name,
        generated: 'Not found',
        fix: `Ensure font '${name}' is available in @font-face declarations`
      });
    }
  });

  // Check for extra fonts
  genNames.forEach(name => {
    if (!origNames.includes(name) && !name.includes('+')) {
      diffs.push({
        type: 'FONT_EXTRA',
        severity: 'LOW',
        original: 'Not present',
        generated: name,
        fix: `Remove or replace font '${name}' if not needed`
      });
    }
  });

  return diffs;
}

/**
 * Compare spacing
 */
function compareSpacing(orig, gen) {
  const diffs = [];
  const tolerance = 1.0; // 1pt tolerance

  if (orig.averageLineHeight && gen.averageLineHeight) {
    const origLH = parseFloat(orig.averageLineHeight);
    const genLH = parseFloat(gen.averageLineHeight);
    const diff = Math.abs(origLH - genLH);

    if (diff > tolerance) {
      diffs.push({
        type: 'LINE_HEIGHT',
        severity: diff > 3 ? 'HIGH' : 'MEDIUM',
        original: `${origLH.toFixed(2)}pt`,
        generated: `${genLH.toFixed(2)}pt`,
        difference: `${diff.toFixed(2)}pt`,
        fix: `Update CSS: line-height: ${origLH.toFixed(2)}pt`
      });
    }
  }

  return diffs;
}

/**
 * Create visual comparison images
 */
function createVisualComparison(originalPdf, generatedPdf) {
  try {
    // Convert first page of each PDF to PNG at high resolution
    execSync(`pdftoppm -png -f 1 -l 1 -r 200 "${originalPdf}" comparison_original`, { encoding: 'utf8' });
    execSync(`pdftoppm -png -f 1 -l 1 -r 200 "${generatedPdf}" comparison_generated`, { encoding: 'utf8' });

    console.log('✓ Visual comparison images created:');
    console.log('  - comparison_original-1.png (original)');
    console.log('  - comparison_generated-1.png (generated)');
    console.log('');
    console.log('Compare these images side-by-side to see visual differences.');
    console.log('');

    // Create difference image if ImageMagick is available
    try {
      execSync('which convert', { encoding: 'utf8' });
      execSync(`convert comparison_original-1.png comparison_generated-1.png -compose difference -composite comparison_diff.png`);
      console.log('✓ Difference image created: comparison_diff.png');
      console.log('  (White = identical, colored = differences)');
      console.log('');
    } catch (e) {
      console.log('ℹ ImageMagick not installed - skipping difference image');
      console.log('  Install with: sudo apt-get install imagemagick');
      console.log('');
    }

  } catch (error) {
    console.log('⚠ Could not create visual comparison (pdftoppm not available)');
  }
}

/**
 * Generate comparison report
 */
function generateComparisonReport(comparison) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('           VISUAL LAYOUT COMPARISON REPORT             ');
  console.log('═══════════════════════════════════════════════════════\n');

  if (comparison.differences.length === 0) {
    console.log('✓ Perfect match! No layout differences detected.\n');
    return;
  }

  // Group by severity
  const critical = comparison.differences.filter(d => d.severity === 'CRITICAL');
  const high = comparison.differences.filter(d => d.severity === 'HIGH');
  const medium = comparison.differences.filter(d => d.severity === 'MEDIUM');
  const low = comparison.differences.filter(d => d.severity === 'LOW');

  if (critical.length > 0) {
    console.log('🚨 CRITICAL DIFFERENCES (Must fix):');
    console.log('─────────────────────────────────────────────────────');
    critical.forEach(diff => printDifference(diff));
    console.log('');
  }

  if (high.length > 0) {
    console.log('⚠️  HIGH PRIORITY (Visible differences):');
    console.log('─────────────────────────────────────────────────────');
    high.forEach(diff => printDifference(diff));
    console.log('');
  }

  if (medium.length > 0) {
    console.log('📊 MEDIUM PRIORITY (May be noticeable):');
    console.log('─────────────────────────────────────────────────────');
    medium.forEach(diff => printDifference(diff));
    console.log('');
  }

  if (low.length > 0) {
    console.log('ℹ️  LOW PRIORITY (Minor differences):');
    console.log('─────────────────────────────────────────────────────');
    low.forEach(diff => printDifference(diff));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

/**
 * Print single difference
 */
function printDifference(diff) {
  console.log(`\n${diff.type}:`);
  console.log(`  Original:  ${diff.original}`);
  console.log(`  Generated: ${diff.generated}`);
  if (diff.difference) {
    console.log(`  Diff:      ${diff.difference}`);
  }
  console.log(`  Fix:       ${diff.fix}`);
}

/**
 * Generate actionable fixes as JSON
 */
function generateFixList(comparison, outputPath) {
  const fixes = comparison.differences.map(diff => ({
    type: diff.type,
    severity: diff.severity,
    cssProperty: extractCSSProperty(diff.fix),
    value: extractCSSValue(diff.fix),
    fullFix: diff.fix
  }));

  fs.writeFileSync(outputPath, JSON.stringify(fixes, null, 2));
  console.log(`✓ Fix list saved to: ${outputPath}\n`);
}

/**
 * Extract CSS property from fix string
 */
function extractCSSProperty(fix) {
  const match = fix.match(/([a-z-]+):/);
  return match ? match[1] : null;
}

/**
 * Extract CSS value from fix string
 */
function extractCSSValue(fix) {
  const match = fix.match(/:\s*([^;]+)/);
  return match ? match[1].trim() : null;
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node visualComparator.js <original-pdf> <generated-pdf> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --save-fixes <file.json>   Save fix list to JSON');
    console.log('');
    console.log('Examples:');
    console.log('  node visualComparator.js original.pdf generated.pdf');
    console.log('  node visualComparator.js original.pdf generated.pdf --save-fixes fixes.json');
    process.exit(1);
  }

  const originalPdf = args[0];
  const generatedPdf = args[1];
  let saveFixesPath = null;

  // Parse options
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--save-fixes' && args[i + 1]) {
      saveFixesPath = args[i + 1];
      i++;
    }
  }

  // Check if PDFs exist
  if (!fs.existsSync(originalPdf)) {
    console.error(`Error: Original PDF not found: ${originalPdf}`);
    process.exit(1);
  }

  if (!fs.existsSync(generatedPdf)) {
    console.error(`Error: Generated PDF not found: ${generatedPdf}`);
    process.exit(1);
  }

  // Compare
  const comparison = compareVisualLayout(originalPdf, generatedPdf);

  // Generate report
  generateComparisonReport(comparison);

  // Save fixes if requested
  if (saveFixesPath) {
    generateFixList(comparison, saveFixesPath);
  }

  console.log('💡 NEXT STEPS:');
  console.log('─────────────────────────────────────────────────────');
  console.log('1. Review comparison_original-1.png vs comparison_generated-1.png');
  console.log('2. Apply the suggested CSS fixes to views/statement.ejs');
  console.log('3. Regenerate PDF and compare again');
  console.log('4. Iterate until differences are minimal');
  console.log('');
}

module.exports = {
  compareVisualLayout,
  generateComparisonReport
};
