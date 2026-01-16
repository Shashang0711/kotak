// PDF Metadata Comparison Tool
// Compares generated PDFs against target metadata

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Extract metadata from a PDF file using pdfinfo and pdffonts
 * Requires: poppler-utils (apt-get install poppler-utils)
 */
function extractPdfMetadata(pdfPath) {
  try {
    // Get basic info
    const pdfinfoOutput = execSync(`pdfinfo "${pdfPath}"`, { encoding: 'utf8' });

    // Get font info
    let fontInfo = [];
    try {
      const pdffontsOutput = execSync(`pdffonts "${pdfPath}"`, { encoding: 'utf8' });
      fontInfo = parsePdfFonts(pdffontsOutput);
    } catch (e) {
      console.log('Could not extract font info:', e.message);
    }

    // Get image info
    let imageInfo = [];
    try {
      const pdfimagesOutput = execSync(`pdfimages -list "${pdfPath}"`, { encoding: 'utf8' });
      imageInfo = parsePdfImages(pdfimagesOutput);
    } catch (e) {
      console.log('Could not extract image info:', e.message);
    }

    return {
      info: parsePdfInfo(pdfinfoOutput),
      fonts: fontInfo,
      images: imageInfo
    };
  } catch (error) {
    console.error('Error extracting metadata:', error.message);
    return null;
  }
}

/**
 * Parse pdfinfo output
 */
function parsePdfInfo(output) {
  const info = {};
  const lines = output.split('\n');

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      info[key] = value;
    }
  }

  return info;
}

/**
 * Parse pdffonts output
 */
function parsePdfFonts(output) {
  const fonts = [];
  const lines = output.split('\n').slice(2); // Skip header lines

  for (const line of lines) {
    if (line.trim()) {
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        fonts.push({
          name: parts[0],
          type: parts[1],
          encoding: parts[2],
          embedded: parts[3],
          subset: parts[4],
          unicode: parts[5]
        });
      }
    }
  }

  return fonts;
}

/**
 * Parse pdfimages output
 */
function parsePdfImages(output) {
  const images = [];
  const lines = output.split('\n').slice(2); // Skip header lines

  for (const line of lines) {
    if (line.trim()) {
      const parts = line.split(/\s+/);
      if (parts.length >= 8) {
        images.push({
          page: parts[0],
          num: parts[1],
          type: parts[2],
          width: parts[3],
          height: parts[4],
          color: parts[5],
          comp: parts[6],
          bpc: parts[7]
        });
      }
    }
  }

  return images;
}

/**
 * Compare two metadata objects
 */
function compareMetadata(generated, target) {
  const differences = {
    critical: [],
    major: [],
    minor: []
  };

  // Critical: Producer mismatch
  if (generated.info.Producer !== target.Producer) {
    differences.critical.push({
      field: 'Producer',
      generated: generated.info.Producer,
      target: target.Producer,
      impact: 'HIGH - Different PDF generation library detected'
    });
  }

  // Critical: PDF Version
  if (generated.info['PDF version'] !== target.PDFVersion) {
    differences.critical.push({
      field: 'PDF Version',
      generated: generated.info['PDF version'],
      target: target.PDFVersion,
      impact: 'MEDIUM - PDF version mismatch'
    });
  }

  // Major: Font differences
  const targetFonts = Object.keys(target.fonts);
  const generatedFontNames = generated.fonts.map(f => f.name);

  for (const fontName of targetFonts) {
    if (!generatedFontNames.includes(fontName)) {
      differences.major.push({
        field: `Font: ${fontName}`,
        generated: 'Missing',
        target: 'Present',
        impact: 'MEDIUM - Font not found in generated PDF'
      });
    } else {
      // Check font properties
      const genFont = generated.fonts.find(f => f.name === fontName);
      const targetFont = target.fonts[fontName];

      if (genFont.embedded !== targetFont.embedded.toString()) {
        differences.major.push({
          field: `Font ${fontName} - Embedded`,
          generated: genFont.embedded,
          target: targetFont.embedded,
          impact: 'HIGH - Embedded font status differs'
        });
      }
    }
  }

  // Major: Image count
  if (generated.images.length !== target.PageCount * 2) {
    differences.major.push({
      field: 'Image Count',
      generated: generated.images.length,
      target: target.PageCount * 2,
      impact: 'MEDIUM - Different number of images'
    });
  }

  // Minor: Page count
  if (parseInt(generated.info.Pages) !== target.PageCount) {
    differences.minor.push({
      field: 'Page Count',
      generated: generated.info.Pages,
      target: target.PageCount,
      impact: 'LOW - Different number of pages (expected for different data)'
    });
  }

  return differences;
}

/**
 * Generate comparison report
 */
function generateReport(differences) {
  console.log('\n============================================');
  console.log('PDF METADATA COMPARISON REPORT');
  console.log('============================================\n');

  if (differences.critical.length === 0 &&
      differences.major.length === 0 &&
      differences.minor.length === 0) {
    console.log('✓ Perfect match! All metadata matches the target.\n');
    return;
  }

  if (differences.critical.length > 0) {
    console.log('🚨 CRITICAL DIFFERENCES (Will be detected):');
    console.log('─'.repeat(44));
    differences.critical.forEach(diff => {
      console.log(`\nField: ${diff.field}`);
      console.log(`  Generated: ${diff.generated}`);
      console.log(`  Target:    ${diff.target}`);
      console.log(`  Impact:    ${diff.impact}`);
    });
    console.log();
  }

  if (differences.major.length > 0) {
    console.log('⚠️  MAJOR DIFFERENCES (Likely to be detected):');
    console.log('─'.repeat(44));
    differences.major.forEach(diff => {
      console.log(`\nField: ${diff.field}`);
      console.log(`  Generated: ${diff.generated}`);
      console.log(`  Target:    ${diff.target}`);
      console.log(`  Impact:    ${diff.impact}`);
    });
    console.log();
  }

  if (differences.minor.length > 0) {
    console.log('ℹ️  MINOR DIFFERENCES (Less likely to be detected):');
    console.log('─'.repeat(44));
    differences.minor.forEach(diff => {
      console.log(`\nField: ${diff.field}`);
      console.log(`  Generated: ${diff.generated}`);
      console.log(`  Target:    ${diff.target}`);
      console.log(`  Impact:    ${diff.impact}`);
    });
    console.log();
  }

  console.log('============================================\n');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node pdfMetadataComparator.js <generated-pdf-path> [target-json-path]');
    console.log('');
    console.log('Example:');
    console.log('  node pdfMetadataComparator.js temp/generated.pdf targetMetadata.json');
    process.exit(1);
  }

  const generatedPdfPath = args[0];
  const targetJsonPath = args[1] || 'targetMetadata.json';

  // Load target metadata
  const target = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

  // Extract generated PDF metadata
  console.log('Extracting metadata from generated PDF...');
  const generated = extractPdfMetadata(generatedPdfPath);

  if (!generated) {
    console.error('Failed to extract metadata from generated PDF');
    process.exit(1);
  }

  // Compare
  const differences = compareMetadata(generated, target);

  // Report
  generateReport(differences);
}

module.exports = {
  extractPdfMetadata,
  compareMetadata,
  generateReport
};
