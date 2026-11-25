// The November 2026 site review: FAQ structured data, phone-sized screenshots, the demo school link, honest price anchors,
// What's new and llms.txt, and the proof slots that stay hidden until something real goes in them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import nunjucks from 'nunjucks';
import { execFileSync } from 'node:child_process';

const site = '_site';
const page = (url) => fs.readFileSync(path.join(site, url, 'index.html'), 'utf8');
// Every JSON-LD node on a page: the site-wide @graph (base.njk) is flattened, so each node is found by its @type.
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; });
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

test('every FAQ page carries one FAQPage that matches its visible questions and answers', () => {
  for (const url of ['pricing', 'directors', 'schools', 'switching', 'studios', 'features/fees']) {
    const html = page(url);
    const faqs = ld(html).filter((b) => b['@type'] === 'FAQPage');
    assert.equal(faqs.length, 1, url);
    const visible = [...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><p class="a">([\s\S]*?)<\/p><\/details>/g)].map((m) => [decode(m[1]), decode(m[2])]);
    assert.deepEqual(faqs[0].mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), visible, url);
  }
});

test('the scope question says per program, with districts welcome, on Pricing and Schools', () => {
  for (const url of ['pricing', 'schools']) {
    const q = ld(page(url)).find((b) => b['@type'] === 'FAQPage').mainEntity.find((x) => x.name === 'Is this a district-wide system?');
    assert.ok(q, url);
    assert.match(q.acceptedAnswer.text, /priced and set up per program/);
    assert.match(q.acceptedAnswer.text, /district agreement/);
  }
});

test('screenshots offer phone-sized copies, and the first hero shot loads straight away', () => {
  const html = page('');
  const first = html.match(/<img src="\/screenshots\/home-hero-all-browser\.webp"[^>]*>/)[0];
  assert.match(first, /srcset="[^"]*-400\.webp 400w[^"]*-800\.webp 800w[^"]*-1200\.webp 1200w[^"]*2000w"/);
  assert.match(first, /sizes="/);
  assert.match(first, /loading="eager"/);
  assert.match(first, /fetchpriority="high"/);
  const later = html.match(/<img src="\/screenshots\/home-hero-band-browser\.webp"[^>]*>/)[0];
  assert.match(later, /loading="lazy"/);
  // Every copy any page lists exists in the build.
  const listed = new Set();
  const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) for (const m of fs.readFileSync(p, 'utf8').matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) listed.add(part.trim().split(' ')[0]); } };
  walk(site);
  assert.ok(listed.size > 100);
  for (const u of listed) assert.ok(fs.existsSync(path.join(site, u)), u);
});

test('the school price card is set apart honestly: an audience badge and a plain anchor, no popularity claim', () => {
  const html = page('pricing');
  assert.match(html, /class="pill pill-primary">Made for school programs</);
  assert.match(html, /Under \$25 a month for your whole program office, billed yearly\./);
  assert.match(html, /Less than one lesson&#39;s tuition a month\./);
  assert.doesNotMatch(html, /[Mm]ost popular/);
});

test('no trial: pricing and subscribe send visitors to explore the demo school on the app', () => {
  assert.match(page('pricing'), /<a href="https:\/\/app\.myprogrampartner\.com\/demo" class="btn btn-outline" data-demo-school-link>Explore the demo school<\/a>/);
  assert.match(page('subscribe'), /href="https:\/\/app\.myprogrampartner\.com\/demo" data-demo-school-link>Explore the demo school</);
  assert.ok(!fs.existsSync(path.join(site, 'trial')));
  for (const url of ['', 'pricing', 'subscribe', 'demo']) assert.doesNotMatch(page(url), /free trial|30-day trial|\/trial\//i, url);
  assert.doesNotMatch(fs.readFileSync(path.join(site, 'llms.txt'), 'utf8'), /trial/i);
  // The site's own form still never gives demo access: it posts to the contact endpoint only.
  assert.match(page('demo'), /data-chat-form data-endpoint="https:\/\/app\.myprogrampartner\.com\/api\/public\/demo-access-request"/);
});

test("What's new: dated entries, newest first, each with its own anchor, linked from the menu and the footer", () => {
  const data = JSON.parse(fs.readFileSync('content/changelog.json', 'utf8'));
  const html = page('changelog');
  const ids = [...html.matchAll(/<li id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, data.entries.length);
  assert.equal(new Set(ids).size, ids.length);
  const dates = data.entries.map((e) => e.date);
  for (const d of dates) assert.match(d, /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/);
  assert.deepEqual([...dates].sort().reverse(), dates);
  const home = page('');
  assert.match(home, /href="\/changelog\/"/);
  assert.match(home.slice(home.indexOf('<footer')), /href="\/changelog\/"/);
});

test('llms.txt maps the site in plain text, with the current price and only real pages', () => {
  const txt = fs.readFileSync(path.join(site, 'llms.txt'), 'utf8');
  assert.match(txt, /^# Program Partner\n\n> /);
  assert.doesNotMatch(txt, /&#39;|&amp;|&quot;|undefined/);
  assert.match(txt, /\$299 a year per program/);
  for (const m of txt.matchAll(/\]\(https:\/\/myprogrampartner\.com(\/[^)#]*)(#[^)]*)?\)/g)) {
    const file = path.join(site, m[1], m[1].endsWith('/') ? 'index.html' : '');
    assert.ok(fs.existsSync(file), m[1]);
    if (m[2]) assert.ok(fs.readFileSync(file, 'utf8').includes('id="' + m[2].slice(1) + '"'), m[2]);
  }
  assert.ok(!fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8').includes('llms.txt'));
});

test('proof slots stay hidden until a real entry exists', () => {
  const home = page('');
  assert.doesNotMatch(home, /h-proof|h-mentions/);
  const about = page('about');
  const org = ld(about).find((b) => b['@type'] === 'Organization');
  assert.equal(org.founder, undefined);
  assert.doesNotMatch(about, /rel="me"/);
});

test('filled proof slots render: quotes with name and program, dated mentions, and profile links in card, footer and data', async () => {
  const config = JSON.parse(fs.readFileSync('src/admin/config.json', 'utf8'));
  const bundle = JSON.parse(fs.readFileSync(path.join(site, 'admin/preview-data.json'), 'utf8'));
  const source = fs.readFileSync('src/admin/preview.js', 'utf8');
  const window = { h: () => null, createClass: (s) => s };
  const sandbox = { window, nunjucks, structuredClone, location: { origin: 'https://myprogrampartner.com' }, fetch: async (u) => ({ json: async () => (u.includes('config.json') ? config : bundle) }), CMS: { registerPreviewTemplate() {}, init() {} }, document: { getElementById() { return { append() {} }; } } };
  await vm.runInNewContext(source, sandbox);
  const p = window.ProgramPartnerPreview;
  const index = structuredClone(bundle.data.copy.index);
  index.proof.items = [{ quote: 'Test quote', name: 'Testname', role: 'Band director', program: 'Test Middle School', photo: '', photo_alt: '' }];
  index.proof.usage_line = 'Test usage line';
  index.mentions.items = [{ source: 'Test newsletter', title: 'Spotlight', url: 'https://example.com/a', date: '2026-11', quote: '' }];
  let html = p.render('copy_index', index, (x) => x);
  assert.match(html, /<blockquote><p>Test quote<\/p><\/blockquote>/);
  assert.match(html, /Testname<\/span><span class="role">Band director, Test Middle School/);
  assert.match(html, /Test usage line/);
  assert.match(html, /<time datetime="2026-11">November 2026<\/time>/);
  const about = structuredClone(bundle.data.copy.about);
  about.team.members[0].profile_url = 'https://example.com/trey';
  about.team.members[1].profile_url = 'https://example.com/andrew';
  html = p.render('copy_about', about, (x) => x);
  assert.match(html, /<a href="https:\/\/example\.com\/trey" rel="me">Trey English on LinkedIn<\/a>/);
  assert.match(html.slice(html.indexOf('<footer')), /href="https:\/\/example\.com\/andrew">Andrew Casal on LinkedIn/);
  const org = ld(html).find((b) => b['@type'] === 'Organization');
  assert.equal(org.founder[0].name, 'Trey English');
  assert.equal(org.member[0].name, 'Andrew Casal');
  // Every file the editor can open renders, the two new ones included.
  for (const name of ['changelog']) {
    const f = config.collections[0].files.find((x) => x.name === name);
    assert.ok(f, name);
    const out = p.render(name, JSON.parse(fs.readFileSync(f.file, 'utf8')), (x) => x);
    assert.ok(!out.includes('undefined'), name);
  }
});

test('families sign in with an approved email: no page outside the legal documents mentions registration or join codes', () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!['admin', 'terms', 'privacy', 'accessibility'].includes(e.name)) walk(p); }
      else if (e.name.endsWith('.html') || e.name.endsWith('.txt')) {
        const t = fs.readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
        if (/registration code|join code|the code you give/i.test(t)) hits.push(p);
      }
    }
  };
  walk(site);
  assert.deepEqual(hits, []);
});
