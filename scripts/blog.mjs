// The blog: articles written and published in HeyCatch, read at build time and turned into /blog/ and
// /blog/<slug> (README: "Blog"). Follows HeyCatch's blog guide, https://heycatch.ai/blog-agents.md.
//
// The key is HeyCatch's read-only blog key (hck_lv_…), from the HEYCATCH_API_KEY environment variable (a GitHub
// Actions secret for the deploy), sent only as the `key` query parameter and never in a header. It is not the
// hck_pk_… analytics key in base.njk.
//
// The blog can never fail a build. With no key the blog is empty. If HeyCatch can't be reached, or answers with
// anything unexpected, the build uses the last good copy in .cache/heycatch/blog.json when there is one (the deploy
// keeps that folder between runs) and otherwise builds an empty blog. A rate-limited call waits as long as it is
// told (up to MAX_RETRY_WAIT_MS) and tries once more, never in a loop.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import xss from 'xss';

export const HEYCATCH_API_BASE = 'https://api.heycatch.ai/v1';
export const BLOG_CACHE_FILE = path.join('.cache', 'heycatch', 'blog.json');
const PAGE_SIZE = 50;
const MAX_PAGES = 100;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRY_WAIT_MS = 10_000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RTL = new Set(['ar', 'he', 'fa', 'ur']);

export const EMPTY_BLOG = Object.freeze({ articles: [], version: 'empty', source: 'empty' });

// ---- Article HTML ----------------------------------------------------------------------------------------------
// content_html is someone else's HTML, so only the elements and attributes below survive. Scripts, styles, frames,
// forms, event handlers, inline styles, classes and javascript: addresses do not.
const HEADING = ['id'];
const ALLOWED = {
  h2: HEADING, h3: HEADING, h4: HEADING, h5: [], h6: [], p: [], br: [], hr: [],
  ul: [], ol: ['start'], li: [], dl: [], dt: [], dd: [],
  a: ['href', 'title'], strong: [], b: [], em: [], i: [], u: [], s: [], mark: [], small: [], sup: [], sub: [],
  blockquote: [], code: [], pre: [], kbd: [],
  table: [], caption: [], thead: [], tbody: [], tfoot: [], tr: [], th: ['colspan', 'rowspan', 'scope'], td: ['colspan', 'rowspan'],
  section: ['id'], div: [], span: [], figure: [], figcaption: [], img: ['src', 'alt', 'width', 'height'], details: [], summary: [],
};
// Elements whose text goes too, not only the tags.
const DROPPED_WITH_CONTENT = ['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'form', 'textarea', 'select', 'button', 'title', 'head'];
// An id that can be a link target and needs no escaping inside quotes.
const SAFE_ID = /^[A-Za-z][\w:.-]{0,120}$/;
const XSS_OPTIONS = {
  whiteList: ALLOWED,
  stripIgnoreTagBody: DROPPED_WITH_CONTENT,
  allowCommentTag: false,
  css: false, // no style attribute is allowed at all
  // Any other element loses its tags and keeps its text. The page title is the only <h1>, so one in the article becomes an <h2>.
  onIgnoreTag: (tag, html) => (tag !== 'h1' ? '' : html.startsWith('</') ? '</h2>' : '<h2>'),
  onTagAttr: (_tag, name, value) => (name !== 'id' ? undefined : SAFE_ID.test(value) ? `id="${value}"` : ''),
};

export function sanitizeArticleHtml(html) {
  return xss(String(html ?? ''), XSS_OPTIONS);
}

const H2 = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/g;
const ID_ATTR = /\bid="([^"]+)"/;
const headingText = (inner) => inner.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// One entry per <h2> with an id, except the FAQ's. Reads sanitised HTML only (attributes are always name="value").
export function articleTableOfContents(sanitizedHtml) {
  const entries = [];
  for (const match of sanitizedHtml.matchAll(H2)) {
    const id = ID_ATTR.exec(match[1])?.[1];
    if (!id || id === 'faq') continue;
    const label = headingText(match[2]);
    if (label) entries.push({ id, label });
  }
  return entries;
}

// Where the Key takeaways list ends, or -1 when the article has none.
function endOfKeyTakeaways(html) {
  for (const match of html.matchAll(H2)) {
    const id = ID_ATTR.exec(match[1])?.[1] ?? '';
    if (!/takeaway/i.test(id) && !/key takeaways/i.test(headingText(match[2]))) continue;
    const after = match.index + match[0].length;
    const next = html.indexOf('<h2', after);
    const listEnd = /<\/(?:ul|ol)>/.exec(html.slice(after, next === -1 ? undefined : next));
    return listEnd ? after + listEnd.index + listEnd[0].length : -1;
  }
  return -1;
}

// Sanitised, with the "Table of contents" after the Key takeaways list, or first when there are no takeaways.
// An article with no linkable headings gets none.
export function prepareArticleHtml(contentHtml) {
  const html = sanitizeArticleHtml(contentHtml);
  const entries = articleTableOfContents(html);
  if (!entries.length) return html;
  const toc = `<nav class="blog-toc" aria-labelledby="blog-toc-h"><h2 id="blog-toc-h">Table of contents</h2><ul>${entries
    .map((e) => `<li><a href="#${e.id}">${e.label}</a></li>`)
    .join('')}</ul></nav>`;
  const at = endOfKeyTakeaways(html);
  return at === -1 ? toc + html : html.slice(0, at) + toc + html.slice(at);
}

// ---- Shapes ----------------------------------------------------------------------------------------------------
const text = (v) => (typeof v === 'string' ? v : '');
const isRecord = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const DAY = /^(\d{4})-(\d{2})-(\d{2})/;

// "2026-11-24" as "November 24, 2026": a calendar day, the same wherever the build runs.
export function dateLabel(day) {
  const m = DAY.exec(String(day || ''));
  const month = m && MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : '';
}

export function languageAttributes(language, siteLanguage = 'en') {
  const lang = String(language || '').trim().toLowerCase();
  const primary = lang.split(/[-_]/)[0];
  if (!lang || primary === siteLanguage) return {};
  return RTL.has(primary) ? { lang, dir: 'rtl' } : { lang };
}

// JSON-LD for a <script>: HeyCatch's object as sent; with no url of its own it gets the page's canonical address.
// "<" is written as < so nothing in an article can close the script element.
export function jsonLdScript(jsonLd, canonicalUrl) {
  if (!isRecord(jsonLd) || !Object.keys(jsonLd).length) return '';
  const hasUrl = typeof jsonLd.url === 'string' && jsonLd.url.length > 0;
  const data = hasUrl ? jsonLd : { ...jsonLd, url: canonicalUrl, mainEntityOfPage: canonicalUrl };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function toSummary(raw) {
  if (!isRecord(raw)) return null;
  const slug = text(raw.slug).trim();
  const title = text(raw.title).trim();
  // A slug becomes a file name, so it can't hold a slash or start with a dot.
  if (!slug || !title || /[\\/]/.test(slug) || slug.startsWith('.')) return null;
  const readTime = Number(raw.read_time);
  const published = (text(raw.published) || text(raw.published_at)).slice(0, 10);
  const updated = (text(raw.updated) || text(raw.updated_at)).slice(0, 10);
  return {
    slug,
    path: `/blog/${encodeURIComponent(slug)}`,
    title,
    published: DAY.test(published) ? published : '',
    updated: DAY.test(updated) ? updated : '',
    publishedLabel: dateLabel(published),
    readTime: Number.isFinite(readTime) && readTime > 0 ? Math.round(readTime) : null,
    language: text(raw.language),
    stamp: text(raw.updated_at) || updated,
  };
}

// What the live site was built from: changes when an article is published, edited or removed.
export function blogVersion(summaries) {
  if (!summaries.length) return 'empty';
  const lines = summaries.map((a) => [a.slug, a.title, a.published, a.stamp, a.readTime].join('\u0001'));
  return crypto.createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);
}

// ---- HeyCatch --------------------------------------------------------------------------------------------------
function client({ apiKey, fetch: doFetch = fetch, sleep, baseUrl = HEYCATCH_API_BASE }) {
  const wait = sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  async function once(pathname, query) {
    const url = new URL(baseUrl + pathname);
    url.searchParams.set('key', apiKey);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    try {
      const res = await doFetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) return { ok: false, status: res.status, retryAfterMs: Number(res.headers.get('retry-after')) * 1000 };
      return { ok: true, body: await res.json() };
    } catch {
      return { ok: false, status: null };
    }
  }
  return async function get(pathname, query = {}) {
    const first = await once(pathname, query);
    if (first.ok || first.status !== 429) return first;
    if (!Number.isFinite(first.retryAfterMs) || first.retryAfterMs > MAX_RETRY_WAIT_MS) return first;
    await wait(Math.max(0, first.retryAfterMs));
    return once(pathname, query);
  };
}

// Every published article's list entry: { ok: true, summaries } or { ok: false }. A revoked key or deleted project
// (403) is an empty blog, not a failure.
export async function fetchArticleList(options) {
  const get = client(options);
  const summaries = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const res = await get('/articles', { limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
    if (!res.ok) return res.status === 403 ? { ok: true, summaries: [] } : { ok: false, status: res.status };
    if (!isRecord(res.body) || !Array.isArray(res.body.articles)) return { ok: false, status: null };
    for (const raw of res.body.articles) {
      const summary = toSummary(raw);
      if (summary && !summaries.some((s) => s.slug === summary.slug)) summaries.push(summary);
    }
    const total = Number(res.body.total);
    if (!res.body.articles.length || !Number.isFinite(total) || (page + 1) * PAGE_SIZE >= total) break;
  }
  return { ok: true, summaries };
}

async function fetchBlog(options, siteUrl) {
  const list = await fetchArticleList(options);
  if (!list.ok) return null;
  const get = client(options);
  const articles = [];
  for (const summary of list.summaries) {
    const res = await get(`/articles/${encodeURIComponent(summary.slug)}`);
    // Unpublished between the two calls: leave it out. Anything else wrong: this whole read failed.
    if (!res.ok && res.status === 404) continue;
    if (!res.ok || !isRecord(res.body) || !isRecord(res.body.article)) return null;
    const raw = res.body.article;
    const { stamp, ...rest } = summary;
    articles.push({
      ...rest,
      ...languageAttributes(summary.language),
      description: text(raw.meta_description),
      html: prepareArticleHtml(text(raw.content_html)),
      jsonLd: jsonLdScript(raw.jsonLd, siteUrl + summary.path),
    });
  }
  return { articles, version: blogVersion(list.summaries), source: 'heycatch' };
}

// The blog for this build. Never throws.
export async function loadBlog({
  apiKey = process.env.HEYCATCH_API_KEY,
  baseUrl = process.env.HEYCATCH_API_BASE || HEYCATCH_API_BASE,
  siteUrl = 'https://myprogrampartner.com',
  cacheFile = BLOG_CACHE_FILE,
  fetch: doFetch,
  sleep,
  log = console.warn,
} = {}) {
  const key = String(apiKey || '').trim();
  if (!key) {
    log('[blog] HEYCATCH_API_KEY is not set: building with no articles.');
    return EMPTY_BLOG;
  }
  let blog = null;
  try {
    blog = await fetchBlog({ apiKey: key, baseUrl, fetch: doFetch, sleep }, siteUrl);
  } catch {
    blog = null;
  }
  if (blog) {
    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(blog));
    } catch {
      // The copy is a convenience; the build goes on without it.
    }
    return blog;
  }
  try {
    const kept = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (Array.isArray(kept.articles)) {
      log(`[blog] HeyCatch could not be read: building with the last good copy (${kept.articles.length} articles).`);
      return { ...kept, source: 'cache' };
    }
  } catch {
    // No copy kept.
  }
  log('[blog] HeyCatch could not be read and no copy is kept: building with no articles.');
  return EMPTY_BLOG;
}
