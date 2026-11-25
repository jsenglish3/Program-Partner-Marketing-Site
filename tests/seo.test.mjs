// The November 2026 SEO audit (HeyCatch): titles, descriptions, image sizes, structured data, related links, the
// sitemap's lastmod, IndexNow and the security headers file. README: "Search", "Sitemap and IndexNow", "Security headers".
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { changedUrls, parseSitemap } from '../scripts/indexnow.mjs';
import indexnow from '../src/_data/indexnow.js';

const site = '_site';
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const sitemap = parseSitemap(fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8'));
const fileFor = (url) => {
  const p = new URL(url).pathname;
  return path.join(site, p.endsWith('/') ? path.join(p, 'index.html') : p + '.html');
};
const pages = [...sitemap.keys()].map((url) => ({ url, path: new URL(url).pathname, html: fs.readFileSync(fileFor(url), 'utf8') }));
const graph = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; });
// The audit doesn't score the privacy policy and terms, whose descriptions are their own.
const legal = new Set(['/privacy/', '/terms/']);

test('every page title is 30 to 60 characters and every description 110 to 160', () => {
  for (const p of pages) {
    const title = decode(p.html.match(/<title>([\s\S]*?)<\/title>/)[1]);
    assert.ok(title.length >= 30 && title.length <= 60, `${p.path}: title is ${title.length} characters: ${title}`);
    if (legal.has(p.path)) continue;
    const desc = decode(p.html.match(/<meta name="description" content="([^"]*)"/)[1]);
    assert.ok(desc.length >= 110 && desc.length <= 160, `${p.path}: description is ${desc.length} characters`);
  }
});

test('the pages the audit named carry their heading in their title', () => {
  const words = (s) => decode(s).replace(/<[^>]+>/g, '').toLowerCase().match(/[a-z]{4,}/g) || [];
  for (const p of ['/', '/about/', '/directors/', '/schools/', '/changelog/', '/contact/', '/pricing/', '/features/fees/', '/features/communication/', '/features/forms/', '/features/events/', '/features/inventory/']) {
    const html = pages.find((x) => x.path === p).html;
    const title = new Set(words(html.match(/<title>([\s\S]*?)<\/title>/)[1]));
    const shared = words(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]).filter((w) => title.has(w));
    assert.ok(shared.length, `${p}: title and heading share no word`);
  }
});

test('every image on every page has its width and height', () => {
  for (const p of pages) for (const tag of p.html.match(/<img\b[^>]*>/g) || []) {
    assert.match(tag, /\swidth="\d+"/, `${p.path}: ${tag.slice(0, 120)}`);
    assert.match(tag, /\sheight="\d+"/, `${p.path}: ${tag.slice(0, 120)}`);
  }
});

test('every page has one graph: the company with its profiles, the site, the app, the page and its breadcrumbs', () => {
  for (const p of pages) {
    const nodes = graph(p.html);
    const org = nodes.find((n) => n['@type'] === 'Organization');
    assert.ok(org && org.sameAs.length >= 3, p.path);
    assert.ok(nodes.some((n) => n['@type'] === 'SoftwareApplication' && n['@id'].endsWith('/#software')), p.path);
    assert.ok(nodes.some((n) => n['@type'] === 'WebSite'), p.path);
    const page = nodes.find((n) => /^(WebPage|AboutPage|ContactPage|CollectionPage)$/.test(n['@type']));
    assert.ok(page && page.url === p.url, p.path);
    if (p.path !== '/') {
      const crumbs = nodes.find((n) => n['@type'] === 'BreadcrumbList');
      assert.ok(crumbs, p.path);
      assert.equal(crumbs.itemListElement.at(-1).item, p.url, p.path);
    }
  }
  const pricing = graph(pages.find((x) => x.path === '/pricing/').html).filter((n) => n['@type'] === 'SoftwareApplication');
  assert.ok(pricing.some((n) => n.offers), 'the pricing page adds the prices to the same app');
  assert.ok(pricing.every((n) => n['@id'].endsWith('/#software')));
});

test('company profiles from Site settings join the footer and the sameAs list', async () => {
  const { default: nunjucks } = await import('nunjucks');
  const vm = await import('node:vm');
  const config = JSON.parse(fs.readFileSync('src/admin/config.json', 'utf8'));
  const bundle = JSON.parse(fs.readFileSync(path.join(site, 'admin/preview-data.json'), 'utf8'));
  const window = { h: () => null, createClass: (s) => s };
  const sandbox = { window, nunjucks, structuredClone, location: { origin: 'https://myprogrampartner.com' }, fetch: async (u) => ({ json: async () => (u.includes('config.json') ? config : bundle) }), CMS: { registerPreviewTemplate() {}, init() {} }, document: { getElementById() { return { append() {} }; } } };
  await vm.runInNewContext(fs.readFileSync('src/admin/preview.js', 'utf8'), sandbox);
  const s = structuredClone(bundle.data.site);
  s.profiles = [{ label: 'LinkedIn', url: 'https://example.com/company/test' }];
  const html = window.ProgramPartnerPreview.render('site', s, (x) => x);
  assert.match(html.slice(html.indexOf('<footer')), /<a href="https:\/\/example\.com\/company\/test">LinkedIn<\/a>/);
  const org = graph(html).find((n) => n['@type'] === 'Organization');
  assert.deepEqual(org.sameAs, [s.facebook, s.instagram, 'https://example.com/company/test']);
  assert.ok(config.collections[0].files.find((f) => f.name === 'site').fields.some((f) => f.name === 'profiles'));
});

test("each page the audit found linked only from menus is now linked from at least two other pages' content", () => {
  const inbound = new Map();
  for (const p of pages) {
    const main = p.html.slice(p.html.indexOf('<main'), p.html.indexOf('</main>'));
    for (const m of main.matchAll(/href="(\/[^"#?]*)/g)) if (m[1] !== p.path && p.path !== '/') (inbound.get(m[1]) || inbound.set(m[1], new Set()).get(m[1])).add(p.path);
  }
  for (const target of ['/directors/', '/boosters/', '/schools/', '/studios/', '/changelog/', '/contact/', '/accessibility/', '/pricing/', '/switching/']) {
    assert.ok((inbound.get(target) || new Set()).size >= 2, `${target} from ${[...(inbound.get(target) || [])].join(', ')}`);
  }
});

test('the sitemap gives each page a real lastmod when the build has the git history', () => {
  for (const [url, lastmod] of sitemap) {
    if (lastmod) assert.ok(!Number.isNaN(Date.parse(lastmod)), url);
  }
  const shallow = (() => { try { return fs.readFileSync('.git/shallow', 'utf8').length > 0; } catch { return false; } })();
  if (fs.existsSync('.git') && !shallow) for (const [url, lastmod] of sitemap) assert.ok(lastmod, `${url} has no lastmod`);
});

test('IndexNow: the key file is served, and only new or changed pages are sent', () => {
  assert.equal(fs.readFileSync(path.join(site, `${indexnow.key}.txt`), 'utf8'), indexnow.key);
  assert.match(indexnow.key, /^[a-f0-9]{32}$/);
  const live = new Map([['https://myprogrampartner.com/a/', '2026-11-01'], ['https://myprogrampartner.com/b/', '2026-11-01']]);
  const next = new Map([['https://myprogrampartner.com/a/', '2026-11-01'], ['https://myprogrampartner.com/b/', '2026-11-20'], ['https://myprogrampartner.com/c/', '2026-11-20'], ['https://example.com/x', '2026-11-20']]);
  assert.deepEqual(changedUrls(live, next), ['https://myprogrampartner.com/b/', 'https://myprogrampartner.com/c/']);
  assert.ok(!fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8').includes(indexnow.key));
});

test('the headers file sends HSTS, the three security headers and a report-only policy that allows every inline script', async () => {
  const text = fs.readFileSync(path.join(site, '_headers'), 'utf8');
  assert.match(text, /Strict-Transport-Security: max-age=31536000; includeSubDomains/);
  assert.match(text, /X-Content-Type-Options: nosniff/);
  assert.match(text, /X-Frame-Options: (DENY|SAMEORIGIN)/);
  assert.match(text, /Referrer-Policy: strict-origin-when-cross-origin/);
  assert.match(text, /^https:\/\/program-partner-site\.:account\.workers\.dev\/\*\n  X-Robots-Tag: noindex/m);
  const csp = text.match(/Content-Security-Policy-Report-Only: (.*)/)[1];
  const { inlineScriptHashes } = await import('../scripts/headers.mjs');
  for (const h of inlineScriptHashes(site)) assert.ok(csp.includes(`'${h}'`), h);
  assert.doesNotMatch(csp.split(';').find((d) => d.trim().startsWith('script-src')), /unsafe-inline/);
  for (const line of text.split('\n')) assert.ok(line.length <= 2000, `a _headers line is ${line.length} characters`);
  for (const p of pages) assert.match(p.html, /<meta name="referrer" content="strict-origin-when-cross-origin">/, p.path);
});
