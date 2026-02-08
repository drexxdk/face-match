import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "../public/icons");

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple icon programmatically
async function generateIcons() {
  for (const size of sizes) {
    // Create an icon matching the header logo design
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="url(#grad${size})"/>
        <g stroke="white" fill="none" stroke-width="${size * 0.06}" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.3}"/>
          <path d="M ${size * 0.4} ${size * 0.4} a ${size * 0.12} ${size * 0.12} 0 0 1 ${size * 0.2} 0.03 c 0 ${size * 0.06} -${size * 0.1} ${size * 0.09} -${size * 0.1} ${size * 0.09}"/>
          <circle cx="${size / 2}" cy="${size * 0.68}" r="${size * 0.03}" fill="white"/>
        </g>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generate Apple touch icon (180x180)
  const appleSize = 180;
  const appleSvg = `
    <svg width="${appleSize}" height="${appleSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradApple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${appleSize}" height="${appleSize}" rx="${appleSize * 0.125}" fill="url(#gradApple)"/>
      <g stroke="white" fill="none" stroke-width="${appleSize * 0.06}" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="${appleSize / 2}" cy="${appleSize / 2}" r="${appleSize * 0.3}"/>
        <path d="M ${appleSize * 0.4} ${appleSize * 0.4} a ${appleSize * 0.12} ${appleSize * 0.12} 0 0 1 ${appleSize * 0.2} 0.03 c 0 ${appleSize * 0.06} -${appleSize * 0.1} ${appleSize * 0.09} -${appleSize * 0.1} ${appleSize * 0.09}"/>
        <circle cx="${appleSize / 2}" cy="${appleSize * 0.68}" r="${appleSize * 0.03}" fill="white"/>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  console.log("Generated apple-touch-icon.png");

  // Generate favicon (matching the header logo)
  const faviconSvg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="url(#grad)"/>
      <g stroke="white" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="16" cy="16" r="9"/>
        <path d="M 13.5 13.5 a 2.5 2.5 0 0 1 5 0.8 c 0 1.6 -2.5 2.4 -2.5 2.4"/>
        <circle cx="16" cy="21" r="0.8" fill="white"/>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(__dirname, "../public/favicon.png"));

  console.log("Generated favicon.png");

  // Generate favicon.ico
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .toFile(path.join(__dirname, "../public/favicon.ico"));

  console.log("Generated favicon.ico");

  console.log("\nAll icons generated successfully!");
}

generateIcons().catch(console.error);
