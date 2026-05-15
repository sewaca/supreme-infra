#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
// Generates favicon.ico and apple-touch-icon PNGs from AppLogo SVG geometry.
// Pure Node.js — no external dependencies, only built-in `zlib`.
import { deflateSync } from 'zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- CRC32 ---
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// --- Icon geometry (matches AppLogo.tsx viewBox 0 0 99 98) ---
const SVG_W = 99;
const SVG_H = 98;
const BLOCKS = [
  { x: 0, y: 0, w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 35, y: 0, w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 0, y: 35, w: 29, h: 28, r: 5, rgb: [0xff, 0x97, 0x0f] },
  { x: 35, y: 35, w: 29, h: 28, r: 5, rgb: [0xff, 0x97, 0x0f] },
  { x: 0, y: 70, w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 35, y: 70, w: 29, h: 28, r: 5, rgb: [0x5a, 0x5a, 0x5a] },
  { x: 70, y: 70, w: 29, h: 28, r: 5, rgb: [0x2f, 0x80, 0xed] },
];

// Returns rgb triple if point hits a block, null if transparent
function sample(sx, sy) {
  for (const { x, y, w, h, r, rgb } of BLOCKS) {
    if (sx < x || sx > x + w || sy < y || sy > y + h) continue;
    const lx = sx - x;
    const ly = sy - y;
    const cx = Math.max(r - lx, lx - (w - r), 0);
    const cy = Math.max(r - ly, ly - (h - r), 0);
    if (cx * cx + cy * cy <= r * r) return rgb;
  }
  return null;
}

// Renders icon at given size using 4×4 supersampling with correct straight alpha.
// Bug in v1: transparent sub-samples contributed 0s to RGB accumulator, darkening
// semi-transparent edge pixels and making them look muddy/non-transparent.
// Fix: accumulate RGB only from opaque hits; alpha = hit_count / total_samples.
function renderRGBA(size) {
  const px = new Uint8Array(size * size * 4);
  const scaleX = SVG_W / size;
  const scaleY = SVG_H / size;
  const padY = (SVG_W - SVG_H) / 2;
  const SS = 4;
  const total = SS * SS;

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let ra = 0,
        ga = 0,
        ba = 0,
        hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (pxi + (sx + 0.5) / SS) * scaleX;
          const fy = (py + (sy + 0.5) / SS) * scaleY - padY;
          const rgb = sample(fx, fy);
          if (rgb !== null) {
            ra += rgb[0];
            ga += rgb[1];
            ba += rgb[2];
            hits++;
          }
        }
      }
      if (hits === 0) continue; // fully transparent — leave as [0,0,0,0]
      const idx = (py * size + pxi) * 4;
      px[idx] = ra / hits; // true colour of the hit block(s)
      px[idx + 1] = ga / hits;
      px[idx + 2] = ba / hits;
      px[idx + 3] = (hits / total) * 255; // coverage → alpha
    }
  }
  return px;
}

// Encodes RGBA pixel data into a PNG buffer
function encodePNG(size) {
  const rgba = renderRGBA(size);
  const stride = size * 4 + 1;
  const raw = new Uint8Array(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter byte: None
    raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), y * stride + 1);
  }

  const compressed = deflateSync(Buffer.from(raw), { level: 9 });

  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// Wraps one or more PNG buffers into a .ico file
function encodeICO(entries) {
  // entries: Array<{ size: number, png: Buffer }>
  const count = entries.length;
  const dirStart = 6 + count * 16;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(count, 4);

  const dirs = [];
  const images = [];
  let offset = dirStart;

  for (const { size, png } of entries) {
    const dir = Buffer.alloc(16);
    dir[0] = size >= 256 ? 0 : size;
    dir[1] = size >= 256 ? 0 : size;
    dir[2] = 0;
    dir[3] = 0;
    dir.writeUInt16LE(1, 4); // color planes
    dir.writeUInt16LE(32, 6); // bits per pixel
    dir.writeUInt32LE(png.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirs.push(dir);
    images.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, ...dirs, ...images]);
}

// --- Main ---
const WEB_SERVICES = [
  'web-auth-ssr',
  'web-documents-ssr',
  'web-messages-ssr',
  'web-news-ssr',
  'web-profile-ssr',
  'web-schedule-ssr',
];

console.log('Rendering icon at multiple sizes...');
const png16 = encodePNG(16);
const png32 = encodePNG(32);
const png48 = encodePNG(48);
const png180 = encodePNG(180);
const png192 = encodePNG(192);
const ico = encodeICO([
  { size: 16, png: png16 },
  { size: 32, png: png32 },
  { size: 48, png: png48 },
]);

for (const svc of WEB_SERVICES) {
  const appDir = join(ROOT, 'services', svc, 'app');
  const pubDir = join(ROOT, 'services', svc, 'public');
  mkdirSync(pubDir, { recursive: true });

  // favicon.ico in app/ → Next.js serves it at /favicon.ico and auto-adds <link rel="shortcut icon">
  writeFileSync(join(appDir, 'favicon.ico'), ico);

  // Well-known paths for iOS Safari (checked without HTML link tags)
  writeFileSync(join(pubDir, 'apple-touch-icon.png'), png180);
  writeFileSync(join(pubDir, 'apple-touch-icon-precomposed.png'), png180);

  console.log(`  ✓ ${svc}`);
}

console.log('Done.');
