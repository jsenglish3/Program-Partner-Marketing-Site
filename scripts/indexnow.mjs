// IndexNow for each deploy (src/_data/indexnow.js; README: "Sitemap and IndexNow").
//
//   node scripts/indexnow.mjs changed _site/sitemap.xml   Before the deploy: compares the new sitemap with the live one
//                                                        and prints urls=<JSON list> (for $GITHUB_OUTPUT) of the pages
//                                                        that are new or whose lastmod changed.
//   INDEXNOW_URLS='[...]' node scripts/indexnow.mjs submit
//                                                        After the deploy: sends that list to IndexNow.
//
// Neither step ever fails the deploy: anything that goes wrong is logged and the step ends quietly.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import indexnow from '../src/_data/indexnow.js';

const SITE = `https://${indexnow.host}`;

export function parseSitemap(xml) {
  const pages = new Map();
  for (const m of String(xml).matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/url>/g)) pages.set(m[1].trim(), (m[2] || '').trim());
  return pages;
}

// Pages in `next` that aren't in `live`, or whose lastmod differs. Only this site's own addresses.
export function changedUrls(live, next) {
  const out = [];
  for (const [url, lastmod] of next) {
    if (!url.startsWith(SITE + '/')) continue;
    if (!live.has(url) || live.get(url) !== lastmod) out.push(url);
  }
  return out;
}

async function changed(file) {
  const next = parseSitemap(fs.readFileSync(file, 'utf8'));
  let live = new Map();
  try {
    const res = await fetch(`${SITE}/sitemap.xml`, { headers: { 'cache-control': 'no-cache' } });
    if (res.ok) live = parseSitemap(await res.text());
    else console.error(`indexnow: the live sitemap answered ${res.status}; every page counts as changed.`);
  } catch (e) {
    console.error(`indexnow: couldn't read the live sitemap (${e.message}); every page counts as changed.`);
  }
  const urls = changedUrls(live, next);
  console.error(`indexnow: ${urls.length} of ${next.size} pages are new or changed.`);
  console.log(`urls=${JSON.stringify(urls)}`);
}

async function submit() {
  let urls = [];
  try {
    urls = JSON.parse(process.env.INDEXNOW_URLS || '[]');
  } catch {
    console.error('indexnow: INDEXNOW_URLS is not a JSON list; nothing sent.');
    return;
  }
  if (!urls.length) {
    console.error('indexnow: nothing changed; nothing sent.');
    return;
  }
  const body = { host: indexnow.host, key: indexnow.key, keyLocation: `${SITE}/${indexnow.key}.txt`, urlList: urls.slice(0, 10000) };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // 200 and 202 both mean accepted (202: the key is still being checked).
    console.error(`indexnow: sent ${urls.length} pages, answer ${res.status}.`);
  } catch (e) {
    console.error(`indexnow: couldn't send (${e.message}).`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'changed') await changed(arg || '_site/sitemap.xml');
    else if (cmd === 'submit') await submit();
    else console.error('usage: indexnow.mjs changed <sitemap.xml> | submit');
  } catch (e) {
    console.error(`indexnow: ${e.message}`);
  }
}
