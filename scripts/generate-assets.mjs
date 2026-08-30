import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FRAMES_DIR = path.join(rootDir, 'public', 'assets', 'frames');
const STICKERS_DIR = path.join(rootDir, 'public', 'assets', 'stickers');

fs.mkdirSync(FRAMES_DIR, { recursive: true });
fs.mkdirSync(STICKERS_DIR, { recursive: true });

// CRC32 calculation table for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Creates an RGBA PNG Buffer from raw pixel RGBA Array
 */
function encodePng(width, height, getPixelRgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bit depth
  ihdr.writeUInt8(6, 9); // Color type 6 (RGBA)
  ihdr.writeUInt8(0, 10); // Compression method
  ihdr.writeUInt8(0, 11); // Filter method
  ihdr.writeUInt8(0, 12); // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let ptr = 0;

  for (let y = 0; y < height; y++) {
    scanlines[ptr++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      scanlines[ptr++] = r;
      scanlines[ptr++] = g;
      scanlines[ptr++] = b;
      scanlines[ptr++] = a;
    }
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// --------------------------------------------------------------------------
// 1. FRAME: Cyber PTI Neon (1920 x 1080)
// --------------------------------------------------------------------------
function generateCyberFrame() {
  console.log('[Assets] Generating Cyber Neon Frame (PNG & SVG)...');
  const width = 1920;
  const height = 1080;

  // SVG representation for ultra-crisp vector rendering
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="neonCyanPurple" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#00f0ff"/>
        <stop offset="50%" stop-color="#b026ff"/>
        <stop offset="100%" stop-color="#00f0ff"/>
      </linearGradient>
      <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glowPink" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Top Header Cyber Bar -->
    <rect x="0" y="0" width="1920" height="80" fill="rgba(6, 11, 25, 0.85)" />
    <line x1="0" y1="80" x2="1920" y2="80" stroke="#00f0ff" stroke-width="4" filter="url(#glowCyan)" />
    <line x1="20" y1="74" x2="1900" y2="74" stroke="#b026ff" stroke-width="2" stroke-dasharray="16, 8" />

    <!-- Top Header Badge -->
    <rect x="60" y="16" width="340" height="48" rx="8" fill="rgba(0, 240, 255, 0.15)" stroke="#00f0ff" stroke-width="2" filter="url(#glowCyan)" />
    <text x="80" y="46" fill="#00f0ff" font-family="'Courier New', monospace, sans-serif" font-weight="900" font-size="20" letter-spacing="2">⚡ PTI BEMP INFORMATICS</text>
    <circle cx="376" cy="40" r="6" fill="#00ff66" filter="url(#glowCyan)" />

    <!-- Top Right Cyber Tag -->
    <rect x="1560" y="16" width="300" height="48" rx="8" fill="rgba(176, 38, 255, 0.15)" stroke="#b026ff" stroke-width="2" />
    <text x="1580" y="46" fill="#b026ff" font-family="'Courier New', monospace, sans-serif" font-weight="800" font-size="16" letter-spacing="1">SYSTEM: ONLINE [AI]</text>

    <!-- Bottom Footer Cyber Bar -->
    <rect x="0" y="1000" width="1920" height="80" fill="rgba(6, 11, 25, 0.9)" />
    <line x1="0" y1="1000" x2="1920" y2="1000" stroke="#00f0ff" stroke-width="4" filter="url(#glowCyan)" />
    <text x="60" y="1048" fill="#ffe600" font-family="'Courier New', monospace, sans-serif" font-weight="bold" font-size="18" letter-spacing="2">FOTO KITA BLUR • TOUCHLESS PHOTOBOOTH 2026</text>
    <text x="1860" y="1048" fill="#00f0ff" font-family="'Courier New', monospace, sans-serif" font-weight="bold" font-size="16" text-anchor="end">BEMP PENDIDIKAN TEKNIK INFORMATIKA UNJ</text>

    <!-- Side Cyber Circuit Lines -->
    <line x1="40" y1="80" x2="40" y2="1000" stroke="#00f0ff" stroke-width="3" stroke-dasharray="24, 12" filter="url(#glowCyan)" />
    <line x1="1880" y1="80" x2="1880" y2="1000" stroke="#00f0ff" stroke-width="3" stroke-dasharray="24, 12" filter="url(#glowCyan)" />

    <!-- Sci-Fi Corner Brackets -->
    <!-- Top-Left -->
    <path d="M 60 180 L 60 100 L 140 100" fill="none" stroke="#00f0ff" stroke-width="6" filter="url(#glowCyan)" />
    <rect x="52" y="92" width="16" height="16" fill="#b026ff" />
    <line x1="72" y1="112" x2="120" y2="112" stroke="#ffffff" stroke-width="2" />
    
    <!-- Top-Right -->
    <path d="M 1860 180 L 1860 100 L 1780 100" fill="none" stroke="#00f0ff" stroke-width="6" filter="url(#glowCyan)" />
    <rect x="1852" y="92" width="16" height="16" fill="#b026ff" />
    <line x1="1848" y1="112" x2="1800" y2="112" stroke="#ffffff" stroke-width="2" />

    <!-- Bottom-Left -->
    <path d="M 60 900 L 60 980 L 140 980" fill="none" stroke="#00f0ff" stroke-width="6" filter="url(#glowCyan)" />
    <rect x="52" y="972" width="16" height="16" fill="#b026ff" />
    <line x1="72" y1="968" x2="120" y2="968" stroke="#ffffff" stroke-width="2" />

    <!-- Bottom-Right -->
    <path d="M 1860 900 L 1860 980 L 1780 980" fill="none" stroke="#00f0ff" stroke-width="6" filter="url(#glowCyan)" />
    <rect x="1852" y="972" width="16" height="16" fill="#b026ff" />
    <line x1="1848" y1="968" x2="1800" y2="968" stroke="#ffffff" stroke-width="2" />
  </svg>`;

  fs.writeFileSync(path.join(FRAMES_DIR, 'frame-cyber.svg'), svg);

  // Rasterize PNG with transparent center
  const pngBuf = encodePng(width, height, (x, y, w, h) => {
    const isTopHeader = y < 80;
    const isBottomFooter = y > 1000;
    const isLeftBorder = x < 45 && y >= 80 && y <= 1000;
    const isRightBorder = x > 1875 && y >= 80 && y <= 1000;

    // Corner brackets
    const isTL = (x >= 55 && x <= 65 && y >= 95 && y <= 185) || (x >= 55 && x <= 145 && y >= 95 && y <= 105);
    const isTR = (x >= 1855 && x <= 1865 && y >= 95 && y <= 185) || (x >= 1775 && x <= 1865 && y >= 95 && y <= 105);
    const isBL = (x >= 55 && x <= 65 && y >= 895 && y <= 985) || (x >= 55 && x <= 145 && y >= 975 && y <= 985);
    const isBR = (x >= 1855 && x <= 1865 && y >= 895 && y <= 985) || (x >= 1775 && x <= 1865 && y >= 975 && y <= 985);

    if (isTopHeader) {
      if (y >= 76 && y <= 80) return [0, 240, 255, 255]; // Neon cyan border
      if (y >= 72 && y <= 74 && Math.floor(x / 16) % 2 === 0) return [176, 38, 255, 255]; // Dashed purple
      return [8, 14, 30, 220]; // Dark cyber glass
    }
    if (isBottomFooter) {
      if (y >= 1000 && y <= 1004) return [0, 240, 255, 255];
      return [8, 14, 30, 230];
    }
    if (isLeftBorder || isRightBorder) {
      if (Math.floor(y / 24) % 2 === 0) return [0, 240, 255, 220];
      return [176, 38, 255, 120];
    }
    if (isTL || isTR || isBL || isBR) {
      return [0, 240, 255, 255];
    }

    // Transparent center window
    return [0, 0, 0, 0];
  });

  fs.writeFileSync(path.join(FRAMES_DIR, 'frame-cyber.png'), pngBuf);
}

// --------------------------------------------------------------------------
// 2. FRAME: Aesthetic Retro Polaroid (1920 x 1080)
// --------------------------------------------------------------------------
function generateRetroFrame() {
  console.log('[Assets] Generating Retro Polaroid Frame (PNG & SVG)...');
  const width = 1920;
  const height = 1080;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <filter id="retroShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="rgba(0,0,0,0.5)"/>
      </filter>
    </defs>

    <!-- Polaroid Outer Frame -->
    <rect x="40" y="30" width="1840" height="1020" rx="24" fill="#faf6ed" filter="url(#retroShadow)" />
    <!-- Cutout Window Mock -->
    <rect x="80" y="70" width="1760" height="840" rx="12" fill="none" stroke="#e0dcd3" stroke-width="4" />

    <!-- Cute Pastel Stickers -->
    <!-- Top-Left Tape -->
    <rect x="120" y="20" width="140" height="40" rx="4" fill="rgba(255, 182, 193, 0.85)" transform="rotate(-5, 120, 20)" />
    <!-- Top-Right Flower Sticker -->
    <circle cx="1800" cy="80" r="30" fill="#ffe066" />
    <circle cx="1800" cy="80" r="16" fill="#ff6b6b" />

    <!-- Bottom Aesthetic Polaroid Footer -->
    <text x="120" y="980" fill="#333333" font-family="'Caveat', 'Brush Script MT', cursive, sans-serif" font-weight="bold" font-size="44" letter-spacing="1">✨ memories with PTI BEMP 2026</text>
    <text x="1800" y="980" fill="#888888" font-family="'Courier New', monospace" font-size="24" text-anchor="end">DATE: 2026.08.28 ★</text>

    <!-- Cute Pastel Doodles -->
    <text x="960" y="980" fill="#ff007f" font-size="32" text-anchor="middle">♥ ✌️ ❀ ★</text>
  </svg>`;

  fs.writeFileSync(path.join(FRAMES_DIR, 'frame-retro.svg'), svg);

  const pngBuf = encodePng(width, height, (x, y, w, h) => {
    // Polaroid border margins: Left: 70px, Right: 70px, Top: 60px, Bottom: 170px
    const inOuter = x >= 40 && x <= 1880 && y >= 30 && y <= 1050;
    const inWindow = x >= 80 && x <= 1840 && y >= 70 && y <= 910;

    if (inOuter && !inWindow) {
      // Warm retro cream polaroid paper color (#faf6ed)
      // Bottom caption bar area
      if (y > 910) {
        if (y >= 910 && y <= 914) return [210, 205, 195, 255]; // Separator line
        return [250, 246, 237, 255];
      }
      return [250, 246, 237, 255];
    }

    // Transparent center
    return [0, 0, 0, 0];
  });

  fs.writeFileSync(path.join(FRAMES_DIR, 'frame-retro.png'), pngBuf);
}

// --------------------------------------------------------------------------
// 3. FRAME: Comic Pop Manga (1920 x 1080)
// --------------------------------------------------------------------------
function generateComicFrame() {
  console.log('[Assets] Generating Comic Pop Frame (PNG & SVG)...');
  const width = 1920;
  const height = 1080;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <pattern id="halftone" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="4" fill="#000000" opacity="0.15" />
      </pattern>
    </defs>

    <!-- Outer Bold Black Ink Comic Border -->
    <rect x="0" y="0" width="1920" height="70" fill="#ffe600" stroke="#000000" stroke-width="8" />
    <rect x="0" y="0" width="1920" height="70" fill="url(#halftone)" />
    <text x="960" y="48" fill="#000000" font-family="'Impact', 'Arial Black', sans-serif" font-size="36" font-weight="900" letter-spacing="4" text-anchor="middle">★ PTI MANGA ACTION PHOTOBOOTH ★</text>

    <!-- Bottom Comic Bar -->
    <rect x="0" y="1010" width="1920" height="70" fill="#00f0ff" stroke="#000000" stroke-width="8" />
    <rect x="0" y="1010" width="1920" height="70" fill="url(#halftone)" />
    <text x="960" y="1058" fill="#000000" font-family="'Impact', 'Arial Black', sans-serif" font-size="32" font-weight="900" letter-spacing="3" text-anchor="middle">POW! • BEMP PTI UNJ 2026 • BOOM!</text>

    <!-- Left & Right Bold Comic Frame Borders -->
    <line x1="20" y1="0" x2="20" y2="1080" stroke="#000000" stroke-width="12" />
    <line x1="1900" y1="0" x2="1900" y2="1080" stroke="#000000" stroke-width="12" />

    <!-- Comic Action Speech Bubble on Top Right -->
    <polygon points="1760,20 1880,10 1860,110 1780,120 1750,140 1760,100" fill="#ff0055" stroke="#000000" stroke-width="4" />
    <text x="1815" y="75" fill="#ffffff" font-family="'Impact', sans-serif" font-size="28" font-weight="bold" text-anchor="middle" transform="rotate(-6, 1815, 75)">POW!</text>
  </svg>`;

  fs.writeFileSync(path.join(FRAMES_DIR, 'frame-comic.svg'), svg);

  const pngBuf = encodePng(width, height, (x, y, w, h) => {
    const isTop = y < 70;
    const isBottom = y > 1010;
    const isLeft = x < 24;
    const isRight = x > 1896;

    if (isTop) {
      if (y >= 64 && y <= 70) return [0, 0, 0, 255]; // Black ink outline
      return [255, 230, 0, 255]; // Vibrant comic yellow
    }
    if (isBottom) {
      if (y >= 1010 && y <= 1016) return [0, 0, 0, 255];
      return [0, 240, 255, 255]; // Comic cyan
    }
    if (isLeft || isRight) {
      return [0, 0, 0, 255]; // Black side borders
    }

    // Transparent center cutout
    return [0, 0, 0, 0];
  });

  fs.writeFileSync(path.join(FRAMES_DIR, 'frame-comic.png'), pngBuf);
}

// --------------------------------------------------------------------------
// 4. STICKERS: Pixel Glasses, Cat Ears, Sparkle Star (512 x 512)
// --------------------------------------------------------------------------
function generateStickers() {
  console.log('[Assets] Generating Stickers (PNG & SVG)...');
  const size = 512;

  // A. Pixel Glasses
  const pixelSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 256" width="512" height="256">
    <!-- 8-Bit Pixel Thug Life Glasses -->
    <rect x="40" y="60" width="180" height="120" fill="#000000" />
    <rect x="292" y="60" width="180" height="120" fill="#000000" />
    <rect x="220" y="80" width="72" height="30" fill="#000000" />
    
    <!-- White Pixel Reflections -->
    <rect x="60" y="80" width="30" height="30" fill="#ffffff" />
    <rect x="90" y="110" width="30" height="30" fill="#ffffff" />
    <rect x="312" y="80" width="30" height="30" fill="#ffffff" />
    <rect x="342" y="110" width="30" height="30" fill="#ffffff" />
  </svg>`;
  fs.writeFileSync(path.join(STICKERS_DIR, 'pixel-glasses.svg'), pixelSvg);

  const pixelPng = encodePng(512, 256, (x, y) => {
    const inLeftLens = x >= 40 && x <= 220 && y >= 60 && y <= 180;
    const inRightLens = x >= 292 && x <= 472 && y >= 60 && y <= 180;
    const inBridge = x >= 220 && x <= 292 && y >= 80 && y <= 110;

    const inLeftReflect1 = x >= 60 && x <= 90 && y >= 80 && y <= 110;
    const inLeftReflect2 = x >= 90 && x <= 120 && y >= 110 && y <= 140;
    const inRightReflect1 = x >= 312 && x <= 342 && y >= 80 && y <= 110;
    const inRightReflect2 = x >= 342 && x <= 372 && y >= 110 && y <= 140;

    if (inLeftReflect1 || inLeftReflect2 || inRightReflect1 || inRightReflect2) {
      return [255, 255, 255, 255];
    }
    if (inLeftLens || inRightLens || inBridge) {
      return [0, 0, 0, 255];
    }
    return [0, 0, 0, 0];
  });
  fs.writeFileSync(path.join(STICKERS_DIR, 'pixel-glasses.png'), pixelPng);

  // B. Cat Ears
  const catSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 300" width="512" height="300">
    <defs>
      <filter id="catGlow">
        <feGaussianBlur stdDeviation="6" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- Headband -->
    <path d="M 60 260 A 200 200 0 0 1 452 260" fill="none" stroke="#ff007f" stroke-width="12" filter="url(#catGlow)" />
    <!-- Left Ear -->
    <polygon points="100,220 50,40 220,130" fill="#1e1035" stroke="#ff007f" stroke-width="10" filter="url(#catGlow)" />
    <polygon points="105,190 75,75 185,135" fill="#ff66cc" />
    <!-- Right Ear -->
    <polygon points="412,220 462,40 292,130" fill="#1e1035" stroke="#ff007f" stroke-width="10" filter="url(#catGlow)" />
    <polygon points="407,190 437,75 327,135" fill="#ff66cc" />
  </svg>`;
  fs.writeFileSync(path.join(STICKERS_DIR, 'cat-ears.svg'), catSvg);

  const catPng = encodePng(512, 300, (x, y) => {
    // Simple bounding shape for cat ears
    const inLeftOuter = (x >= 50 && x <= 220 && y >= 40 && y <= 220);
    const inRightOuter = (x >= 292 && x <= 462 && y >= 40 && y <= 220);

    if (inLeftOuter || inRightOuter) {
      return [255, 0, 127, 240];
    }
    return [0, 0, 0, 0];
  });
  fs.writeFileSync(path.join(STICKERS_DIR, 'cat-ears.png'), catPng);

  // C. Sparkle Star
  const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <filter id="starGlow">
        <feGaussianBlur stdDeviation="12" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- 4-Point Anime Sparkle Star -->
    <path d="M 256 20 Q 256 256 500 256 Q 256 256 256 492 Q 256 256 12 256 Q 256 256 256 20 Z" fill="#ffe600" filter="url(#starGlow)" />
    <circle cx="256" cy="256" r="40" fill="#ffffff" />
  </svg>`;
  fs.writeFileSync(path.join(STICKERS_DIR, 'sparkle-star.svg'), starSvg);

  const starPng = encodePng(512, 512, (x, y) => {
    const cx = 256, cy = 256;
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    const dist = Math.hypot(dx, dy);

    if (dist < 40) return [255, 255, 255, 255]; // Center glow
    if ((dx < 18 && dy < 220) || (dy < 18 && dx < 220)) {
      return [255, 230, 0, 255]; // Flare arms
    }
    return [0, 0, 0, 0];
  });
  fs.writeFileSync(path.join(STICKERS_DIR, 'sparkle-star.png'), starPng);
}

function main() {
  console.log('[Assets] Generating 100% transparent high-resolution photobooth overlays & stickers...');
  generateCyberFrame();
  generateRetroFrame();
  generateComicFrame();
  generateStickers();
  console.log('[Assets] All transparent frames and stickers generated successfully in public/assets/');
}

main();
