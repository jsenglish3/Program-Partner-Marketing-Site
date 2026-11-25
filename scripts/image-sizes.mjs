// Width and height on every image (eleventy.config.js runs this on each page as it's written): the image's own size
// in pixels, read from the file, so the browser can hold the space before the image arrives and the text doesn't jump.
// CSS still decides how big each image is drawn. Only this site's own files (/screenshots/, /assets/, /uploads/);
// an <img> that already has both attributes is left alone.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const roots = { '/screenshots/': 'src/screenshots', '/assets/': 'src/assets', '/uploads/': 'src/uploads' };
const sizes = new Map();

async function sizeOf(src) {
  const clean = decodeURI(src.split(/[?#]/)[0]);
  const prefix = Object.keys(roots).find((p) => clean.startsWith(p));
  if (!prefix) return null;
  const file = path.join(process.cwd(), roots[prefix], clean.slice(prefix.length));
  if (!sizes.has(file)) {
    let size = null;
    try {
      if (fs.existsSync(file)) {
        const m = await sharp(file).metadata();
        if (m.width && m.height) size = { width: m.width, height: m.height };
      }
    } catch {
      size = null;
    }
    sizes.set(file, size);
  }
  return sizes.get(file);
}

export async function addImageSizes(html) {
  const tags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const todo = [...new Set(tags.filter((t) => !/\swidth="/.test(t) || !/\sheight="/.test(t)))];
  if (!todo.length) return html;
  const done = new Map();
  for (const tag of todo) {
    const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
    const size = src && (await sizeOf(src));
    if (!size) continue;
    let next = tag.replace(/\s(width|height)="[^"]*"/g, '');
    next = next.replace(/\s*\/?>$/, ` width="${size.width}" height="${size.height}">`);
    done.set(tag, next);
  }
  return html.replace(/<img\b[^>]*>/g, (t) => done.get(t) || t);
}
