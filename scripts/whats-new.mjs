// What's new (/changelog/): the entries Program Partner keeps in its one What's new list (plan WN-7, owner
// 26 November 2026), read when the site is built. Program Partner marks each entry live, with the date and time, when
// the release that carries it goes out, and its console can fix an entry's words or hide one; the site shows the
// entries marked for the website, newest first, with that time in Eastern Time. The page also ends with the newest
// few from Woodshed, linking to woodshedpractice.com's own What's new.
//
// The page can never fail a build. If Program Partner can't be read, or answers with anything unexpected, the build
// uses the last good copy in .cache/whats-new/feed.json (the deploy keeps that folder between runs), and otherwise
// the entries the page had before the list existed (content/changelog-before-feed.json).
//
// The feed is public product copy (app.myprogrampartner.com/api/public/release-notes): no key, nothing about who
// asks. The deploy workflow's check (scripts/whats-new-changed.mjs) rebuilds the site when the list changes.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const FEED_BASE = 'https://app.myprogrampartner.com/api/public/release-notes';
export const CACHE_FILE = path.join('.cache', 'whats-new', 'feed.json');
export const BEFORE_FEED_FILE = path.join('content', 'changelog-before-feed.json');
const REQUEST_TIMEOUT_MS = 10_000;
/** How many of Woodshed's newest the page's "Latest in Woodshed" box shows. */
export const WOODSHED_LATEST = 3;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const PRECISIONS = new Set(['time', 'day', 'month']);

/** The anchor an entry had before the list (its date and title, as changelog.njk made it), so old links still land. */
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** The calendar parts of an instant in Eastern Time. */
function eastern(iso) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: 'h12',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), time: `${parts.hour}:${parts.minute} ${parts.dayPeriod}` };
}

/**
 * One entry for the page: its id, its old anchor, its date as the page writes it (YYYY-MM-DD, or YYYY-MM for a
 * month-only entry), the words for that date ("November 24, 2026 · 3:42 PM ET", "November 16, 2026" or
 * "November 2026"), its title and words, and its link. Null when it isn't one.
 */
export function pageEntry(item) {
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !ID.test(item.id)) return null;
  if (typeof item.title !== 'string' || !item.title.trim() || typeof item.line !== 'string' || !item.line.trim()) return null;
  if (typeof item.liveAt !== 'string' || Number.isNaN(Date.parse(item.liveAt))) return null;
  const precision = PRECISIONS.has(item.precision) ? item.precision : 'day';
  const e = eastern(item.liveAt);
  const mm = String(e.month).padStart(2, '0');
  const dd = String(e.day).padStart(2, '0');
  const date = precision === 'month' ? `${e.year}-${mm}` : `${e.year}-${mm}-${dd}`;
  const dayWords = `${MONTHS[e.month - 1]} ${e.day}, ${e.year}`;
  const label = precision === 'month' ? `${MONTHS[e.month - 1]} ${e.year}` : precision === 'day' ? dayWords : `${dayWords} · ${e.time} ET`;
  const body = typeof item.body === 'string' && item.body.trim() ? `${item.line.trim()} ${item.body.trim()}` : item.line.trim();
  const link = typeof item.link === 'string' && /^https:\/\/\S+$/.test(item.link) ? item.link : null;
  return {
    id: item.id,
    legacyAnchor: precision === 'time' ? null : slug(`${date}-${item.title.trim()}`),
    date,
    datetime: precision === 'time' ? new Date(item.liveAt).toISOString() : date,
    liveAt: new Date(item.liveAt).toISOString(),
    precision,
    label,
    title: item.title.trim(),
    body,
    link,
    access: typeof item.access === 'string' ? item.access : null,
  };
}

/** The entries from the feed's answer for one product, newest first, or null when it isn't an answer. */
export function readFeedAnswer(body, product) {
  if (!body || body.product !== product || !Array.isArray(body.entries)) return null;
  return body.entries
    .slice(0, 500)
    .map(pageEntry)
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.liveAt) - Date.parse(a.liveAt) || a.id.localeCompare(b.id));
}

async function fetchProduct(product, { fetchImpl, base }) {
  const res = await fetchImpl(`${base}?product=${product}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { accept: 'application/json' } });
  if (!res.ok) return null;
  return readFeedAnswer(await res.json(), product);
}

/** Both products' website entries from Program Partner, or null when either couldn't be read. */
export async function fetchWhatsNew({ fetchImpl = globalThis.fetch, base = FEED_BASE } = {}) {
  try {
    const [programPartner, woodshed] = await Promise.all([fetchProduct('program_partner', { fetchImpl, base }), fetchProduct('woodshed', { fetchImpl, base })]);
    if (!programPartner || !woodshed) return null;
    return { programPartner, woodshed };
  } catch {
    return null;
  }
}

/** Which set of entries a build holds: changes whenever an entry is added, fixed, hidden or goes live. */
export function whatsNewVersion({ programPartner, woodshed }) {
  const key = JSON.stringify([programPartner, woodshed.slice(0, WOODSHED_LATEST)].map((list) => list.map((e) => [e.id, e.liveAt, e.precision, e.title, e.body, e.link])));
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}

/** The page's entries before the list existed, in the same shape (content/changelog-before-feed.json). */
export function beforeFeed(file = BEFORE_FEED_FILE) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entries = (data.entries || []).map((e) => {
    const month = e.date.length === 7;
    const liveAt = `${month ? `${e.date}-01` : e.date}T17:00:00.000Z`;
    return pageEntry({ id: e.id || slug(e.title), title: e.title, line: e.body, liveAt, precision: month ? 'month' : 'day' });
  });
  return { programPartner: entries.filter(Boolean), woodshed: [] };
}

function readCache(file) {
  try {
    const kept = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!kept || !Array.isArray(kept.programPartner) || !Array.isArray(kept.woodshed)) return null;
    return { programPartner: kept.programPartner.map(pageEntry).filter(Boolean), woodshed: kept.woodshed.map(pageEntry).filter(Boolean) };
  } catch {
    return null;
  }
}

/**
 * What the page builds from: { programPartner, woodshed, version, source }, source being 'feed', 'cache' or
 * 'before-feed'. A good read is kept for the next build.
 */
export async function loadWhatsNew({ fetchImpl, base, offline = false, cacheFile = CACHE_FILE, beforeFeedFile = BEFORE_FEED_FILE } = {}) {
  const fresh = offline ? null : await fetchWhatsNew({ fetchImpl: fetchImpl ?? globalThis.fetch, base: base ?? FEED_BASE });
  if (fresh) {
    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      // Kept in the feed's own shape, so the next build reads it back the same way.
      const back = (e) => ({ id: e.id, title: e.title, line: e.body, liveAt: e.liveAt, precision: e.precision, link: e.link, access: e.access });
      fs.writeFileSync(cacheFile, JSON.stringify({ programPartner: fresh.programPartner.map(back), woodshed: fresh.woodshed.map(back) }));
    } catch {
      // A copy that can't be kept only means the next failed read falls back further.
    }
    return { ...fresh, version: whatsNewVersion(fresh), source: 'feed' };
  }
  const kept = readCache(cacheFile);
  if (kept) return { ...kept, version: whatsNewVersion(kept), source: 'cache' };
  const before = beforeFeed(beforeFeedFile);
  return { ...before, version: whatsNewVersion(before), source: 'before-feed' };
}

/** RSS 2.0 for the page's entries (/changelog/feed.xml), each linking to its own anchor. */
export function rssFeed({ siteUrl, title, description, entries }) {
  const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const page = `${siteUrl}/changelog/`;
  const items = entries
    .map((e) => `<item><title>${xml(e.title)}</title><link>${xml(e.link ?? `${page}#${e.id}`)}</link><guid isPermaLink="false">${xml(e.id)}</guid><pubDate>${new Date(e.liveAt).toUTCString()}</pubDate><description>${xml(e.body)}</description></item>`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${xml(title)}</title>`,
    `<link>${xml(page)}</link>`,
    `<description>${xml(description)}</description>`,
    `<atom:link href="${xml(`${page}feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}

/**
 * The /changelog/ page's data (src/_data/changelog.js): its heading and introduction from content/changelog.json and
 * the list. WHATS_NEW_FEED_BASE points a build at another copy of the feed (the tests' own server), or "off" to read
 * none; WHATS_NEW_CACHE_FILE keeps the copy somewhere else. The content editor's preview (scripts/build-cms.mjs) runs
 * after the build and passes offline, so it shows what the build kept rather than reading Program Partner again.
 */
export async function changelogPage({ offline = false } = {}) {
  const words = JSON.parse(fs.readFileSync(path.join('content', 'changelog.json'), 'utf8'));
  const base = process.env.WHATS_NEW_FEED_BASE;
  const list = await loadWhatsNew({
    offline: offline || base === 'off',
    base: base && base !== 'off' ? base : undefined,
    cacheFile: process.env.WHATS_NEW_CACHE_FILE || undefined,
  });
  return {
    heading: words.heading,
    intro: words.intro,
    entries: list.programPartner,
    woodshed: list.woodshed.slice(0, WOODSHED_LATEST),
    version: list.version,
    source: list.source,
  };
}
