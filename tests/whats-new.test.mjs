// What's new (/changelog/, plan WN-7): the page reads Program Partner's What's new list when the site is built,
// shows each entry with its time in Eastern Time (or its date for older ones), keeps old anchors working, ends with
// Woodshed's latest, and never fails a build: a list that can't be read falls back to the last good copy, then to
// the entries the page had before the list.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { beforeFeed, loadWhatsNew, pageEntry, readFeedAnswer, rssFeed, whatsNewVersion } from '../scripts/whats-new.mjs';

const run = promisify(execFile);

/** Program Partner's answer for one product (release-notes.server.ts, toWebsiteItem). */
const answer = (product, entries) => ({ product, scope: 'web', entries });
const item = (id, over = {}) => ({ id, title: `Title ${id}`, line: `Line ${id}.`, body: null, liveAt: '2026-11-24T20:42:00.000Z', precision: 'time', link: null, audiences: ['staff'], access: null, ...over });

const PP = [
  item('newest', { title: 'Fees & "families"', body: 'More detail.' }),
  item('calendar-import-by-link', { title: 'Calendar import by link', liveAt: '2026-11-16T17:00:00.000Z', precision: 'day' }),
  item('access-control-review', { title: 'An access control review of the whole platform', liveAt: '2026-11-01T17:00:00.000Z', precision: 'month' }),
];
const WOODSHED = [item('write-the-note', { title: 'Write the note', audiences: ['directors'] }), item('held-counts', { liveAt: '2026-11-19T17:00:00.000Z', precision: 'day' }), item('older', { liveAt: '2026-11-10T15:00:00.000Z' }), item('oldest', { liveAt: '2026-11-01T15:00:00.000Z' })];

function serve({ pp = PP, woodshed = WOODSHED, status = 200 } = {}) {
  const asked = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    asked.push(url.searchParams.get('product'));
    res.writeHead(status, { 'content-type': 'application/json' });
    const product = url.searchParams.get('product');
    res.end(status === 200 ? JSON.stringify(answer(product, product === 'woodshed' ? woodshed : pp)) : '{}');
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}/api/public/release-notes`, asked })));
}

async function build(env) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-whats-new-site-'));
  await run(process.execPath, ['node_modules/@11ty/eleventy/cmd.cjs', '--output=' + output], { env: { ...process.env, HEYCATCH_API_KEY: '', ...env } });
  return { output, read: (p) => fs.readFileSync(path.join(output, p), 'utf8') };
}

test('an entry reads its time in Eastern Time, or its date or month, and keeps the anchor it had before', () => {
  assert.deepEqual(pageEntry(item('a')), {
    id: 'a',
    legacyAnchor: null,
    date: '2026-11-24',
    datetime: '2026-11-24T20:42:00.000Z',
    liveAt: '2026-11-24T20:42:00.000Z',
    precision: 'time',
    label: 'November 24, 2026 · 3:42 PM ET',
    title: 'Title a',
    body: 'Line a.',
    link: null,
    access: null,
  });
  const day = pageEntry(PP[1]);
  assert.equal(day.label, 'November 16, 2026');
  assert.equal(day.legacyAnchor, '2026-11-16-calendar-import-by-link');
  const month = pageEntry(PP[2]);
  assert.equal(month.label, 'November 2026');
  assert.equal(month.date, '2026-11');
  assert.equal(month.legacyAnchor, '2026-11-an-access-control-review-of-the-whole-platform');
  assert.equal(pageEntry(item('b', { body: 'And more.' })).body, 'Line b. And more.');
  assert.equal(pageEntry(item('Bad Id')), null);
  assert.equal(pageEntry(item('c', { liveAt: 'soon' })), null);
  assert.equal(pageEntry(item('d', { link: 'javascript:alert(1)' })).link, null);
  assert.equal(readFeedAnswer(answer('woodshed', PP), 'program_partner'), null);
});

test('the version changes when an entry is added, fixed or goes live, not otherwise', () => {
  const list = (pp, w = WOODSHED) => ({ programPartner: readFeedAnswer(answer('program_partner', pp), 'program_partner'), woodshed: readFeedAnswer(answer('woodshed', w), 'woodshed') });
  const base = whatsNewVersion(list(PP));
  assert.equal(base, whatsNewVersion(list(PP)));
  assert.notEqual(base, whatsNewVersion(list([...PP, item('another', { liveAt: '2026-10-01T00:00:00Z' })])));
  assert.notEqual(base, whatsNewVersion(list([{ ...PP[0], title: 'Fixed' }, ...PP.slice(1)])));
  assert.notEqual(base, whatsNewVersion(list(PP, [item('newer-woodshed', { liveAt: '2026-11-26T00:00:00Z' }), ...WOODSHED])));
});

test('the page shows the list, newest first, with old anchors, its RSS feed and Woodshed\'s latest', async () => {
  const { server, base, asked } = await serve();
  const cache = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pp-whats-new-cache-')), 'feed.json');
  const site = await build({ WHATS_NEW_FEED_BASE: base, WHATS_NEW_CACHE_FILE: cache });
  try {
    assert.deepEqual(asked.sort(), ['program_partner', 'woodshed']);
    const html = site.read('changelog/index.html');
    const ids = [...html.matchAll(/<li id="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids.slice(0, 3), ['newest', 'calendar-import-by-link', 'access-control-review']);
    assert.match(html, /<time datetime="2026-11-24T20:42:00.000Z">November 24, 2026 · 3:42 PM ET<\/time>/);
    assert.match(html, /<h2><a href="#newest">Fees &amp; &quot;families&quot;<\/a><\/h2>\s*<p>Line newest\. More detail\.<\/p>/);
    assert.match(html, /<li id="calendar-import-by-link"><span id="2026-11-16-calendar-import-by-link" aria-hidden="true"><\/span>/);
    assert.match(html, /<link rel="alternate" type="application\/rss\+xml" title="What&#39;s new in Program Partner" href="\/changelog\/feed.xml">|<link rel="alternate" type="application\/rss\+xml" title="What's new in Program Partner" href="\/changelog\/feed.xml">/);
    // Woodshed's newest three, linking to its own What's new.
    const box = html.slice(html.indexOf('Latest in Woodshed'));
    assert.deepEqual([...box.matchAll(/woodshedpractice\.com\/whats-new#([a-z-]+)/g)].map((m) => m[1]), ['write-the-note', 'held-counts', 'older']);
    const feed = site.read('changelog/feed.xml');
    assert.match(feed, /<title>Fees &amp; &quot;families&quot;<\/title><link>https:\/\/myprogrampartner\.com\/changelog\/#newest<\/link>/);
    assert.equal(site.read('changelog/version.txt').trim().length, 16);
    assert.match(site.read('_redirects'), /^\/whats-new\/ \/changelog\/ 301$/m);
    assert.match(site.read('llms.txt'), /- November 24, 2026 · 3:42 PM ET: \[Fees & "families"\]\(https:\/\/myprogrampartner\.com\/changelog\/#newest\)/);
    // A good read is kept for a later build that can't read the list.
    assert.ok(JSON.parse(fs.readFileSync(cache, 'utf8')).programPartner.length === 3);
  } finally {
    server.close();
    fs.rmSync(site.output, { recursive: true, force: true });
  }

  // The list can't be read: the kept copy is used, and the build doesn't fail.
  const down = await serve({ status: 503 });
  const again = await build({ WHATS_NEW_FEED_BASE: down.base, WHATS_NEW_CACHE_FILE: cache });
  try {
    assert.match(again.read('changelog/index.html'), /<li id="newest">/);
  } finally {
    down.server.close();
    fs.rmSync(again.output, { recursive: true, force: true });
    fs.rmSync(path.dirname(cache), { recursive: true, force: true });
  }
});

test('with no list and no kept copy, the page has the entries it had before the list, with their old anchors', async () => {
  const site = await build({ WHATS_NEW_FEED_BASE: 'off', WHATS_NEW_CACHE_FILE: path.join(os.tmpdir(), 'pp-whats-new-none', 'feed.json') });
  try {
    const html = site.read('changelog/index.html');
    const before = JSON.parse(fs.readFileSync('content/changelog-before-feed.json', 'utf8')).entries;
    assert.equal([...html.matchAll(/<li id="/g)].length, before.length);
    for (const e of before) {
      assert.ok(html.includes(`<li id="${e.id}">`), e.id);
      const old = `${e.date}-${e.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      assert.ok(html.includes(`id="${old}"`), `${e.id} keeps ${old}`);
    }
    assert.ok(!html.includes('Latest in Woodshed'), 'no Woodshed box without its entries');
  } finally {
    fs.rmSync(site.output, { recursive: true, force: true });
  }
});

test('the fallback and the cache read back in the page\'s shape', async () => {
  const before = beforeFeed();
  assert.ok(before.programPartner.every((e) => e.precision === 'day' || e.precision === 'month'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-whats-new-load-'));
  try {
    const cacheFile = path.join(dir, 'feed.json');
    const loaded = await loadWhatsNew({ fetchImpl: async () => ({ ok: false }), cacheFile });
    assert.equal(loaded.source, 'before-feed');
    fs.writeFileSync(cacheFile, JSON.stringify({ programPartner: [item('kept')], woodshed: [] }));
    const kept = await loadWhatsNew({ fetchImpl: async () => ({ ok: false }), cacheFile });
    assert.equal(kept.source, 'cache');
    assert.deepEqual(kept.programPartner.map((e) => e.id), ['kept']);
    const rss = rssFeed({ siteUrl: 'https://myprogrampartner.com', title: 'T', description: 'D', entries: kept.programPartner });
    assert.match(rss, /<guid isPermaLink="false">kept<\/guid>/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
