const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    if (!fs.existsSync(svgPath)) {
      console.error('Error: icon.svg not found at', svgPath);
      process.exit(1);
    }

    console.log('Generating PWA icons from SVG...');

    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(outputDir, 'icon-192x192.png'));

    console.log('✓ Generated icon-192x192.png');

    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'icon-512x512.png'));

    console.log('✓ Generated icon-512x512.png');
    console.log('✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
