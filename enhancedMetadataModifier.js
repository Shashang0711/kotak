// Enhanced PDF Metadata Modifier
// Attempts to match target metadata as closely as possible

const muhammara = require('muhammara');
const fs = require('fs');

/**
 * Apply comprehensive metadata modifications to match target
 *
 * @param {string} inputPath - Path to input PDF
 * @param {string} outputPath - Path to output PDF
 * @param {object} targetMetadata - Target metadata from targetMetadata.json
 */
function applyTargetMetadata(inputPath, outputPath, targetMetadata) {
  try {
    const pdfWriter = muhammara.createWriterToModify(inputPath, {
      modifiedFilePath: outputPath,
      compress: false, // Match target (optimized: no)
      version: targetMetadata.PDFVersion ? parseFloat(targetMetadata.PDFVersion) : 1.4
    });

    const context = pdfWriter.getDocumentContext();
    const infoDictionary = context.getInfoDictionary();

    // Set Producer to match target exactly
    infoDictionary.producer = targetMetadata.Producer || "iText 5.3.4 2000-2012 1T3XT BVBA (AGPL-version)";

    // Remove all other standard metadata fields to match target
    infoDictionary.creator = "";
    infoDictionary.title = "";
    infoDictionary.author = "";
    infoDictionary.subject = "";
    infoDictionary.keywords = "";

    // Set dates - you can pass custom dates or use current
    const now = new Date();
    infoDictionary.setCreationDate(now);
    infoDictionary.setModDate(now);

    // Remove XMP metadata stream if present
    // Target has: metadata_stream: "no"
    try {
      const catalog = context.getCatalogInformation();
      if (catalog && catalog.Metadata) {
        delete catalog.Metadata;
      }
    } catch (e) {
      // Catalog modification may not be supported
    }

    pdfWriter.end();

    console.log('✓ Metadata modified successfully');
    return true;

  } catch (error) {
    console.error('Error modifying PDF metadata:', error);

    // Fallback: just copy the file
    try {
      fs.copyFileSync(inputPath, outputPath);
      console.log('⚠ Metadata modification failed, copied original file');
    } catch (copyError) {
      console.error('Failed to copy file:', copyError);
    }

    return false;
  }
}

/**
 * Apply metadata with custom dates (useful for backdating)
 *
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {object} options - { producer, creationDate, modDate }
 */
function applyCustomMetadata(inputPath, outputPath, options = {}) {
  try {
    const pdfWriter = muhammara.createWriterToModify(inputPath, {
      modifiedFilePath: outputPath,
      compress: false,
      version: 1.4
    });

    const infoDictionary = pdfWriter.getDocumentContext().getInfoDictionary();

    // Set producer
    infoDictionary.producer = options.producer || "iText 5.3.4 2000-2012 1T3XT BVBA (AGPL-version)";

    // Clear other fields
    infoDictionary.creator = "";
    infoDictionary.title = "";
    infoDictionary.author = "";
    infoDictionary.subject = "";

    // Set custom dates if provided
    if (options.creationDate) {
      const createDate = typeof options.creationDate === 'string'
        ? new Date(options.creationDate)
        : options.creationDate;
      infoDictionary.setCreationDate(createDate);
    }

    if (options.modDate) {
      const modDate = typeof options.modDate === 'string'
        ? new Date(options.modDate)
        : options.modDate;
      infoDictionary.setModDate(modDate);
    } else if (options.creationDate) {
      // If only creation date provided, use same for mod date
      const createDate = typeof options.creationDate === 'string'
        ? new Date(options.creationDate)
        : options.creationDate;
      infoDictionary.setModDate(createDate);
    }

    pdfWriter.end();
    console.log('✓ Custom metadata applied successfully');
    return true;

  } catch (error) {
    console.error('Error applying custom metadata:', error);
    return false;
  }
}

/**
 * Check if fonts are properly NOT embedded (target requirement)
 * Note: This is informational only, Puppeteer embeds fonts by default
 */
function analyzeFontEmbedding(pdfPath) {
  const { execSync } = require('child_process');

  try {
    const output = execSync(`pdffonts "${pdfPath}"`, { encoding: 'utf8' });
    console.log('\nFont Embedding Analysis:');
    console.log('─'.repeat(50));
    console.log(output);

    // Check if any fonts are embedded
    if (output.includes('yes')) {
      console.log('⚠ WARNING: Some fonts are embedded');
      console.log('Target requires: embedded = false for base fonts');
      console.log('This is a limitation of Puppeteer/Chrome PDF engine\n');
    } else {
      console.log('✓ No fonts embedded (matches target)\n');
    }
  } catch (error) {
    console.log('Could not analyze fonts (pdffonts not installed)\n');
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node enhancedMetadataModifier.js <input-pdf> <output-pdf> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --date "2026-01-06"        Set creation date');
    console.log('  --producer "iText 5.3.4"   Set producer string');
    console.log('  --target targetMetadata.json   Use target metadata file');
    console.log('');
    console.log('Examples:');
    console.log('  node enhancedMetadataModifier.js input.pdf output.pdf --target targetMetadata.json');
    console.log('  node enhancedMetadataModifier.js input.pdf output.pdf --date "2026-01-06"');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      options.creationDate = args[i + 1];
      options.modDate = args[i + 1];
      i++;
    } else if (args[i] === '--producer' && args[i + 1]) {
      options.producer = args[i + 1];
      i++;
    } else if (args[i] === '--target' && args[i + 1]) {
      const targetData = JSON.parse(fs.readFileSync(args[i + 1], 'utf8'));
      options.producer = targetData.Producer;
      i++;
    }
  }

  console.log('Modifying PDF metadata...');
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Producer: ${options.producer || 'iText 5.3.4 2000-2012 1T3XT BVBA (AGPL-version)'}`);

  if (options.creationDate) {
    console.log(`Date: ${options.creationDate}`);
  }

  console.log('');

  const success = applyCustomMetadata(inputPath, outputPath, options);

  if (success) {
    // Analyze font embedding
    analyzeFontEmbedding(outputPath);
    console.log('Done! Compare with: node pdfMetadataComparator.js ' + outputPath);
  }
}

module.exports = {
  applyTargetMetadata,
  applyCustomMetadata,
  analyzeFontEmbedding
};
