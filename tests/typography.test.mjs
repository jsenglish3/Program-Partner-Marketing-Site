import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Cabin is the one typeface for the public site (docs/TYPOGRAPHY.md). Pages and
// components use the tokens (var(--font-sans), var(--font-heading),
// var(--font-numeric)); a family name written anywhere else fails here.
// src/admin is the content editor's own chrome, not a public page, and is not scanned.
const ALLOWED = new Set([
  'cabin', 'cabin figures', 'cabin fallback',
  'ui-sans-serif', 'system-ui', 'sans-serif',
  'ui-monospace', 'sfmono-regular', 'menlo', 'consolas', 'liberation mono', 'monospace',
  'inherit', 'initial', 'unset',
]);
const FONT_DIR = 'src/assets/fonts';

function files(dir, ext) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return p.startsWith('src/admin') ? [] : files(p, ext);
    return ext.test(e.name) ? [p] : [];
  });
}

function families(value) {
  let v = value.trim();
  if (/^(inherit|initial|unset)$/i.test(v)) return [];
  return v.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function declarations(source) {
  const out = [];
  // Strip @font-face blocks: their src: local(...) names are the fallback's sources, not usage.
  const text = source.replace(/@font-face\s*{[^}]*}/g, '');
  for (const m of text.matchAll(/font-family\s*:\s*([^;}"'<>]+(?:"[^"]*"[^;}"'<>]*)*)/gi)) out.push(m[1]);
  for (const m of text.matchAll(/(?<![-\w])font\s*:\s*([^;}"<>]+)/gi)) {
    const v = m[1].trim();
    if (/^(inherit|initial|unset)$/i.test(v)) continue;
    // Shorthand: style/weight, then size[/line-height], then the family list.
    const rest = v.replace(/^.*?\d[\d.]*(px|rem|em|%)(\s*\/\s*[\d.]+\w*)?\s+/, '');
    out.push(rest);
  }
  return out;
}

const scanned = [
  ...files('src/assets', /\.(css|js)$/),
  ...files('src/_includes', /\.njk$/),
  ...fs.readdirSync('src').filter((f) => f.endsWith('.njk')).map((f) => path.join('src', f)),
];

test('no hard-coded font families outside the Cabin tokens', () => {
  const bad = [];
  for (const file of scanned) {
    for (const decl of declarations(fs.readFileSync(file, 'utf8'))) {
      for (const fam of families(decl)) {
        if (/^var\(--font-(sans|heading|numeric)\)$/.test(fam)) continue;
        if (!ALLOWED.has(fam.toLowerCase())) bad.push(`${file}: ${fam}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('font faces are Cabin only, self-hosted, and every file is used and licensed', () => {
  const css = fs.readFileSync('src/assets/site.css', 'utf8');
  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
  const declared = new Set(faces.map((f) => f.match(/font-family:\s*"([^"]+)"/)[1]));
  assert.deepEqual([...declared].sort(), ['Cabin', 'Cabin Fallback', 'Cabin Figures']);
  const urls = faces.flatMap((f) => [...f.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]));
  for (const u of urls) {
    assert.ok(!/^https?:/.test(u), `font from another host: ${u}`);
    const file = path.join('src/assets', u);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(0, 4).toString(), 'wOF2', file);
  }
  for (const f of faces) {
    if (/font-family:\s*"Cabin(?: Figures)?"/.test(f)) assert.match(f, /font-display:\s*swap/);
  }
  const shipped = fs.readdirSync(FONT_DIR).filter((f) => f.endsWith('.woff2')).sort();
  assert.deepEqual(shipped, urls.map((u) => path.basename(u)).sort(), 'every shipped font file is referenced');
  assert.match(fs.readFileSync(path.join(FONT_DIR, 'OFL-Cabin.txt'), 'utf8'), /SIL OPEN FONT LICENSE/);
});

test('only the Latin Cabin face is preloaded, and it exists', () => {
  const base = fs.readFileSync('src/_includes/layouts/base.njk', 'utf8');
  const preloads = [...base.matchAll(/<link rel="preload" href="([^"]+)" as="font"[^>]*>/g)];
  assert.deepEqual(preloads.map((m) => m[1]), ['/assets/fonts/cabin-latin-normal.woff2']);
  assert.match(preloads[0][0], /type="font\/woff2" crossorigin/);
  assert.ok(fs.existsSync('src/assets/fonts/cabin-latin-normal.woff2'));
});
