// The sitemap's <lastmod> for each page (src/src.11tydata.js, src/sitemap.njk): when the page's own content last
// changed on main, read from git. A page's own content is its template and the content files it is built from, not
// the shared layout, header, footer or head metadata, so a footer edit doesn't make every page look new.
//
// The date is the commit that brought the change into main (--first-parent), so a pull request counts from when it
// was merged. Without the history (a shallow clone, or no git at all) there is no honest date, and the page gets none:
// deploy.yml checks out the full history for this.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
let usable;
function gitUsable() {
  if (usable === undefined) {
    try {
      usable = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() === 'false';
    } catch {
      usable = false;
    }
  }
  return usable;
}

const cache = new Map();
export function lastCommitDate(files) {
  const list = files.filter((f) => fs.existsSync(path.join(root, f)));
  if (!list.length || !gitUsable()) return undefined;
  const key = list.join('\n');
  if (!cache.has(key)) {
    let date;
    try {
      date = execFileSync('git', ['log', '-1', '--first-parent', '--format=%cI', '--', ...list], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined;
    } catch {
      date = undefined;
    }
    cache.set(key, date);
  }
  return cache.get(key);
}

// The later of two W3C dates (either may be missing).
export function later(a, b) {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

// The files each page is built from. inputPath is Eleventy's (./src/feature.njk); data is the page's data.
export function sourceFiles(inputPath, data) {
  const file = inputPath.replace(/^\.\//, '');
  const name = path.basename(file).replace(/\.(njk|11ty\.js)$/, '');
  if (name === 'feature' && data.f) return [file, `content/features/${data.f.key}.json`, 'content/copy/feature.json'];
  if (name === 'audience' && data.a) return [file, `content/audiences/${data.a.key}.json`, 'content/copy/audience.json'];
  if (name === 'legal' && data.k) return [file, `content/legal/${data.k}.json`];
  const files = [file, `content/copy/${name}.json`];
  if (name === 'index') files.push('content/copy/pathways.json', 'src/_includes/partials/pathways.njk');
  if (name === 'switching') files.push('content/switching.json');
  if (name === 'changelog') files.push('content/changelog.json', 'scripts/whats-new.mjs');
  if (name === 'demo') files.push('src/_includes/partials/chat-form.njk');
  if (name === 'pricing' || name === 'subscribe') files.push('content/copy/pricing.json', 'src/_data/pricing.js');
  return files;
}
