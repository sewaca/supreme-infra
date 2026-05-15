#!/usr/bin/env node
// Generates favicon assets for web-news-ssr (catchall backend — serves /favicon.ico etc.).
// Pure Node.js — no external dependencies, only built-in `zlib`.
// Formats per https://habr.com/ru/companies/htmlacademy/articles/578224/
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT  = join(ROOT, 'services', 'web-news-ssr', 'public');

// --- CRC32 ---
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// --- Icon geometry (AppLogo.tsx, viewBox 0 0 99 98) ---
const SVG_W = 99;
const SVG_H = 98;
const BLOCKS = [
  { x: 0,  y: 0,  w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 35, y: 0,  w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 0,  y: 35, w: 29, h: 28, r: 5, rgb: [0xff, 0x97, 0x0f] },
  { x: 35, y: 35, w: 29, h: 28, r: 5, rgb: [0xff, 0x97, 0x0f] },
  { x: 0,  y: 70, w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 35, y: 70, w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 70, y: 70, w: 29, h: 28, r: 5, rgb: [0x2f, 0x80, 0xed] },
];

// Returns rgb triple if point is inside a block, null if transparent
function sample(sx, sy) {
  for (const { x, y, w, h, r, rgb } of BLOCKS) {
    if (sx < x || sx > x + w || sy < y || sy > y + h) continue;
    const lx = sx - x, ly = sy - y;
    const cx = Math.max(r - lx, lx - (w - r), 0);
    const cy = Math.max(r - ly, ly - (h - r), 0);
    if (cx * cx + cy * cy <= r * r) return rgb;
  }
  return null;
}

// 4×4 supersampling with correct straight alpha
// (accumulate RGB only from opaque hits; alpha = coverage)
function renderRGBA(size) {
  const px = new Uint8Array(size * size * 4);
  const scaleX = SVG_W / size;
  const scaleY = SVG_H / size;
  const padY   = (SVG_W - SVG_H) / 2; // centre 99×98 in a square
  const SS     = 4;
  const total  = SS * SS;

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let ra = 0, ga = 0, ba = 0, hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const rgb = sample(
            (pxi + (sx + 0.5) / SS) * scaleX,
            (py  + (sy + 0.5) / SS) * scaleY - padY,
          );
          if (rgb) { ra += rgb[0]; ga += rgb[1]; ba += rgb[2]; hits++; }
        }
      }
      if (!hits) continue;
      const idx = (py * size + pxi) * 4;
      px[idx]     = ra / hits;
      px[idx + 1] = ga / hits;
      px[idx + 2] = ba / hits;
      px[idx + 3] = (hits / total) * 255;
    }
  }
  return px;
}

function encodePNG(size) {
  const rgba   = renderRGBA(size);
  const stride = size * 4 + 1;
  const raw    = new Uint8Array(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), y * stride + 1);
  }
  const compressed = deflateSync(Buffer.from(raw), { level: 9 });

  function chunk(type, data) {
    const t   = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// ICO with one or more PNG entries
function encodeICO(entries) {
  const count    = entries.length;
  const dirStart = 6 + count * 16;
  const header   = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4);

  const dirs = [], images = [];
  let offset = dirStart;
  for (const { size, png } of entries) {
    const dir = Buffer.alloc(16);
    dir[0] = size >= 256 ? 0 : size; dir[1] = dir[0];
    dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(png.length, 8); dir.writeUInt32LE(offset, 12);
    dirs.push(dir); images.push(png); offset += png.length;
  }
  return Buffer.concat([header, ...dirs, ...images]);
}

// SVG — written as plain text, same geometry as AppLogo.tsx
const SVG_CONTENT = `\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 99 98">
  <rect x="0"  y="0"  width="29" height="28" rx="5" fill="#5A5A5A"/>
  <rect x="35" y="0"  width="29" height="28" rx="5" fill="#5A5A5A"/>
  <rect x="0"  y="35" width="29" height="28" rx="5" fill="#FF970F"/>
  <rect x="35" y="35" width="29" height="28" rx="5" fill="#FF970F"/>
  <rect x="0"  y="70" width="29" height="28" rx="5" fill="#5A5A5A"/>
  <rect x="35" y="70" width="29" height="28" rx="5" fill="#5A5A5A"/>
  <rect x="70" y="70" width="29" height="28" rx="5" fill="#2F80ED"/>
</svg>
`;

const MANIFEST_CONTENT = JSON.stringify({
  icons: [
    { src: '/192.png', type: 'image/png', sizes: '192x192' },
    { src: '/512.png', type: 'image/png', sizes: '512x512' },
  ],
}, null, 2) + '\n';

// --- Main ---
mkdirSync(OUT, { recursive: true });

console.log('Rendering PNGs...');
const png32  = encodePNG(32);
const png180 = encodePNG(180);
const png192 = encodePNG(192);
const png512 = encodePNG(512);

writeFileSync(join(OUT, 'favicon.ico'), encodeICO([{ size: 32, png: png32 }]));
writeFileSync(join(OUT, 'icon.svg'),    SVG_CONTENT);
writeFileSync(join(OUT, 'apple.png'),   png180);
writeFileSync(join(OUT, '192.png'),     png192);
writeFileSync(join(OUT, '512.png'),     png512);
writeFileSync(join(OUT, 'manifest.webmanifest'), MANIFEST_CONTENT);

console.log('Done. Files written to services/web-news-ssr/public/:');
console.log('  favicon.ico (32×32 ICO)');
console.log('  icon.svg    (vector)');
console.log('  apple.png   (180×180)');
console.log('  192.png     (192×192)');
console.log('  512.png     (512×512)');
console.log('  manifest.webmanifest');
