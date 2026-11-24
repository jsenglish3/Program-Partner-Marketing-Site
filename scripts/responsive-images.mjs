// Smaller copies of every screenshot, so a phone downloads a phone-sized file instead of the desktop original.
//
// Browser and tablet shots are captured at 2x (2000 px wide) and phone shots at 786 px. For each image in
// src/screenshots/ (and anything uploaded through the content editor into src/uploads/) the build writes
// WebP copies at the widths below that are clearly narrower than the original, into a w/ folder next to it:
//   /screenshots/home-hero-all-browser.webp -> /screenshots/w/home-hero-all-browser-400.webp, -800, -1200
// The frame macro (src/_includes/macros.njk) lists them in srcset with the original as the widest choice, and
// the browser picks the smallest one that is sharp at the frame's size and the screen's pixel density.
//
// Nothing here changes the originals, and an image with no copies (a new upload before the next build, or the
// content editor's preview) still shows: the macro only adds srcset when copies exist.
//
// Resized files are cached in .cache/responsive/ by content hash, so only new or changed images are encoded.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SOURCES = [
  { dir: 'src/screenshots', url: '/screenshots/' },
  { dir: 'src/uploads', url: '/uploads/' },
];
const WIDTHS = [400, 800, 1200];
const CACHE = '.cache/responsive';
const IMAGE = /\.(png|jpe?g|webp)$/i;

let planned = null;

function hashOf(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

// The copies to make for one image: every ladder width at least 15% narrower than the original.
export function widthsFor(width) {
  return WIDTHS.filter((w) => w <= width * 0.85);
}

// { "/screenshots/x.webp": { file, width, hash, variants: [{ width, url, out }] } } for every image that gets copies.
export async function plan() {
  if (planned) return planned;
  const out = {};
  for (const src of SOURCES) {
    if (!fs.existsSync(src.dir)) continue;
    for (const name of fs.readdirSync(src.dir)) {
      if (!IMAGE.test(name)) continue;
      const file = path.join(src.dir, name);
      const { width } = await sharp(file).metadata();
      const widths = widthsFor(width || 0);
      if (!widths.length) continue;
      const stem = name.replace(IMAGE, '');
      out[src.url + name] = {
        file,
        width,
        hash: hashOf(file),
        variants: widths.map((w) => ({
          width: w,
          url: src.url + 'w/' + stem + '-' + w + '.webp',
          out: path.join(src.url.slice(1), 'w', stem + '-' + w + '.webp'),
        })),
      };
    }
  }
  planned = out;
  return out;
}

// "a-400.webp 400w, a-800.webp 800w, ..., a.webp 2000w" for each planned image, keyed "<url>@srcset".
export async function srcsets() {
  const out = {};
  for (const [url, p] of Object.entries(await plan())) {
    out[url + '@srcset'] = [...p.variants.map((v) => v.url + ' ' + v.width + 'w'), url + ' ' + p.width + 'w'].join(', ');
  }
  return out;
}

// Encode (or reuse from the cache) every planned copy and put it in the build output.
export async function writeVariants(outputDir) {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const p of Object.values(await plan())) {
    for (const v of p.variants) {
      const cached = path.join(CACHE, p.hash + '-' + v.width + '.webp');
      if (!fs.existsSync(cached)) {
        await sharp(p.file).resize({ width: v.width }).webp({ quality: 80, effort: 4 }).toFile(cached + '.tmp');
        fs.renameSync(cached + '.tmp', cached);
      }
      const dest = path.join(outputDir, v.out);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(cached, dest);
    }
  }
}

// A watched rebuild after a screenshot is added or replaced must look again.
export function forget() {
  planned = null;
}
