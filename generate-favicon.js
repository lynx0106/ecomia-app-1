#!/usr/bin/env node

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'public', 'logo-clean.png');
const outputPath = path.join(__dirname, 'public', 'favicon.ico');

// Generate 32x32 PNG first, then convert to ICO
sharp(inputPath)
  .resize(32, 32, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  })
  .toFile(path.join(__dirname, 'public', 'favicon-32.png'))
  .then(() => {
    console.log('✓ Generated favicon-32.png');
    // For now, copy the 32x32 PNG as ICO (browsers accept this)
    fs.copyFileSync(path.join(__dirname, 'public', 'favicon-32.png'), outputPath);
    console.log('✓ Generated favicon.ico');
  })
  .catch(err => {
    console.error('Error generating favicon:', err);
    process.exit(1);
  });
