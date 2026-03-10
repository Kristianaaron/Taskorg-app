/**
 * Generates required PWA icon PNGs from icon.svg
 */
import {
  generateTransparentAsset,
  generateMaskableAsset,
  generateFavicon,
} from '@vite-pwa/assets-generator/api';
import { readFileSync, writeFileSync } from 'fs';

const svgBuffer = readFileSync('./public/icon.svg');

async function toBuffer(sharpInstance) {
  return sharpInstance.toBuffer();
}

async function run() {
  // Transparent icons (192, 512)
  for (const size of [64, 192, 512]) {
    const sharp = await generateTransparentAsset('png', svgBuffer, size, {
      padding: 0,
      resizeOptions: { background: 'transparent' },
      outputOptions: {},
    });
    const buf = await toBuffer(sharp);
    writeFileSync(`public/pwa-${size}x${size}.png`, buf);
    console.log(`✓ pwa-${size}x${size}.png`);
  }

  // Maskable icons
  for (const size of [192, 512]) {
    const sharp = await generateMaskableAsset('png', svgBuffer, size, {
      padding: 0.1,
      resizeOptions: { background: '#6366f1' },
      outputOptions: {},
    });
    const buf = await toBuffer(sharp);
    writeFileSync(`public/maskable-icon-${size}x${size}.png`, buf);
    console.log(`✓ maskable-icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  const appleSharp = await generateTransparentAsset('png', svgBuffer, 180, {
    padding: 0.05,
    resizeOptions: { background: '#6366f1' },
    outputOptions: {},
  });
  const appleBuf = await toBuffer(appleSharp);
  writeFileSync('public/apple-touch-icon-180x180.png', appleBuf);
  console.log('✓ apple-touch-icon-180x180.png');

  console.log('\nAll icons generated!');
}

run().catch(console.error);
