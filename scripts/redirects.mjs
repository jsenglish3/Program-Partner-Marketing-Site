// _redirects: addresses that forward to another page, written after each build (eleventy.config.js). Cloudflare
// reads it from the assets, as it reads _headers (README: "Hosting"; the staging copy on Cloudflare Pages too).
//
// /whats-new/ forwards to /changelog/, the What's new page's address since it began (plan WN-7, D10).
import fs from 'node:fs';
import path from 'node:path';

export const REDIRECTS = [
  ['/whats-new', '/changelog/', 301],
  ['/whats-new/', '/changelog/', 301],
];

export function writeRedirects(outputDir) {
  const lines = ['# Written by scripts/redirects.mjs on every build.', ...REDIRECTS.map(([from, to, code]) => `${from} ${to} ${code}`), ''];
  fs.writeFileSync(path.join(outputDir, '_redirects'), lines.join('\n'));
}
