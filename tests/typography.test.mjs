import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Cabin is the one typeface for the public site (docs/TYPOGRAPHY.md). Pages and
// components name no family at all: they use the tokens (var(--font-sans),
// var(--font-heading), var(--font-numeric)), whose values live only in the
// custom properties in site.css. The literal family names appear nowhere else.
// src/admin is the content editor's own chrome, not a public page, and is not scanned.
const KEYWORDS = new Set(['inherit', 'initial', 'unset']);
const TOKEN = /^var\(--font-(sans|heading|numeric)\)$/;
const FONT_DIR = 'src/assets/fonts';

function files(dir, ext) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return p.startsWith('src/admin') ? [] : files(p, ext);
    return ext.test(e.name) ? [p] : [];
  });
}

function families(value) {
  return value.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

// A declared value: unquoted text, or a quoted family name in either quote
// style. A quote followed by markup (the end of a style="" attribute) ends it.
const VALUE = String.raw`((?:"[\w\s-]+"|'[\w\s-]+'|[^;}"'<>\n])+)`;

function declarations(source) {
  const out = [];
  // Strip @font-face blocks: their src: local(...) names are the fallback's sources, not usage.
  const text = source.replace(/@font-face\s*{[^}]*}/g, '');
  for (const m of text.matchAll(new RegExp(String.raw`font-family\s*:\s*` + VALUE, 'gi'))) out.push(m[1]);
  for (const m of text.matchAll(new RegExp(String.raw`(?<![-\w])font\s*:\s*` + VALUE, 'gi'))) {
    const v = m[1].trim();
    if (KEYWORDS.has(v.toLowerCase())) continue;
    // Shorthand: style/weight, then size[/line-height], then the family list.
    out.push(v.replace(/^.*?\d[\d.]*(px|rem|em|%)(\s*\/\s*[\d.]+\w*)?\s*/, ''));
  }
  return out;
}

function offenders(source) {
  return declarations(source)
    .flatMap(families)
    .filter((fam) => !TOKEN.test(fam) && !KEYWORDS.has(fam.toLowerCase()));
}

const scanned = [
  ...files('src/assets', /\.(css|js)$/),
  ...files('src/_includes', /\.njk$/),
  ...fs.readdirSync('src').filter((f) => f.endsWith('.njk')).map((f) => path.join('src', f)),
];

test('the guard catches families however they are written', () => {
  for (const css of [
    "font-family: 'Georgia'",
    'font-family:"Georgia"',
    'font-family: Georgia, serif',
    'font-family: Cabin',
    'font: 600 12px "Georgia"',
    "font:12px/1.4 'Georgia', serif",
    '<span style="font-family:Georgia">x</span>',
  ]) {
    assert.ok(offenders(css).length > 0, `missed: ${css}`);
  }
  for (const css of [
    'font-family: var(--font-heading)',
    '<span style="font-family:var(--font-sans);font-weight:500">x</span>',
    'font: inherit',
    'font: 500 14px var(--font-sans)',
  ]) {
    assert.deepEqual(offenders(css), [], css);
  }
});

test('pages and components use the font tokens, never a family name', () => {
  const bad = scanned.flatMap((file) =>
    offenders(fs.readFileSync(file, 'utf8')).map((fam) => `${file}: ${fam}`),
  );
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
