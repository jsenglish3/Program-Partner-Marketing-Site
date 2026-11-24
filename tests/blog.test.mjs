// The blog (README: "Blog"): articles read from HeyCatch at build time. A fake HeyCatch stands in here.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  articleTableOfContents, blogVersion, dateLabel, fetchArticleList, jsonLdScript, languageAttributes, loadBlog,
  prepareArticleHtml, sanitizeArticleHtml,
} from '../scripts/blog.mjs';

const run = promisify(execFile);
const KEY = 'hck_lv_test';
const raw = (n, more = {}) => ({
  id: `id-${n}`, slug: `post-${n}`, title: `Post ${n}`, meta_description: `Hidden description ${n}`,
  published: '2026-11-01', updated: '2026-11-02', read_time: 5, keywords: [], featured_image: '', language: 'en',
  published_at: '2026-11-01T12:00:00Z', updated_at: '2026-11-02T12:00:00Z', hero_image_url: '', ...more,
});
const ARTICLE_HTML = [
  '<h2 id="key-takeaways">Key takeaways</h2><ul><li>Collect fees early</li><li>Send one reminder</li></ul>',
  '<h2 id="why-fees-slip">Why fees <em>slip</em></h2><p onclick="steal()">Because nobody asked.</p><script>alert(1)</script>',
  '<h2>No id here</h2><h2 id="what-to-do">What to do</h2><ol><li>Ask</li></ol>',
  '<h2 id="faq">FAQ</h2><h3>Is it hard?</h3><p>No.</p>',
].join('');
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });

// A fake HeyCatch for loadBlog: `handler` answers each request URL.
function fake(handler) {
  const calls = [];
  const sleeps = [];
  const cacheFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pp-blog-')), 'blog.json');
  const options = {
    apiKey: KEY, cacheFile, log: () => {},
    fetch: async (input, init) => { const url = new URL(String(input)); calls.push(url); assert.equal(init.headers, undefined); return handler(url); },
    sleep: async (ms) => { sleeps.push(ms); },
  };
  return { options, calls, sleeps, cacheFile };
}
const serve = (list) => (url) => {
  if (url.pathname === '/v1/articles') {
    const offset = Number(url.searchParams.get('offset'));
    return json({ articles: list.slice(offset, offset + 50), total: list.length, limit: 50, offset });
  }
  const found = list.find((a) => a.slug === decodeURIComponent(url.pathname.split('/').pop()));
  return found ? json({ article: { ...found, content_html: ARTICLE_HTML, content_markdown: '', jsonLd: { '@type': 'Article' } } }) : json({}, 404);
};

test('article HTML keeps its structure and heading ids, and loses anything that could run', () => {
  assert.equal(
    sanitizeArticleHtml('<h2 id="one">One</h2><p>A <a href="https://example.org/a">link</a>.</p>'),
    '<h2 id="one">One</h2><p>A <a href="https://example.org/a">link</a>.</p>',
  );
  assert.equal(sanitizeArticleHtml('<p>a</p><script>alert(1)</script><style>p{}</style><iframe src="https://example.org"></iframe><!-- x --><p>b</p>'), '<p>a</p><p>b</p>');
  const html = sanitizeArticleHtml('<p onclick="x()" style="position:fixed" class="c">hi</p><a href="javascript:alert(1)">bad</a><a href="JaVaScRiPt:alert(1)">worse</a><img src="x" onerror="alert(1)">');
  assert.doesNotMatch(html, /onclick|onerror|style=|class=|javascript:/i);
  assert.match(html, /<p>hi<\/p>/);
  assert.equal(sanitizeArticleHtml('<marquee>hello</marquee><svg onload="x()"><p>in</p></svg>'), 'hello');
  assert.equal(sanitizeArticleHtml('<h1 id="x">Top</h1>'), '<h2>Top</h2>');
  assert.equal(sanitizeArticleHtml('<h2 id="a b">x</h2><h2 id="9">y</h2>'), '<h2>x</h2><h2>y</h2>');
});

test('the table of contents lists each h2 with an id except the FAQ, after the Key takeaways', () => {
  assert.deepEqual(articleTableOfContents(sanitizeArticleHtml(ARTICLE_HTML)), [
    { id: 'key-takeaways', label: 'Key takeaways' },
    { id: 'why-fees-slip', label: 'Why fees slip' },
    { id: 'what-to-do', label: 'What to do' },
  ]);
  const html = prepareArticleHtml(ARTICLE_HTML);
  assert.match(html.slice(html.indexOf('</ul>') + 5), /^<nav class="blog-toc"/);
  assert.match(html, /<h2 id="blog-toc-h">Table of contents<\/h2>/);
  assert.ok(!html.includes('href="#faq"'));
  // The article itself is unchanged around it, in order.
  assert.equal(html.replace(/<nav class="blog-toc"[\s\S]*?<\/nav>/, ''), sanitizeArticleHtml(ARTICLE_HTML));
  assert.match(prepareArticleHtml('<p>Intro</p><h2 id="a">A</h2>'), /^<nav class="blog-toc"[\s\S]*<\/nav><p>Intro<\/p>/);
  assert.equal(prepareArticleHtml('<p>Text</p><h2>Plain</h2>'), '<p>Text</p><h2>Plain</h2>');
  assert.match(prepareArticleHtml('<h2 id="a">Fees &lt;b&gt; &amp; forms</h2>'), /<a href="#a">Fees &lt;b&gt; &amp; forms<\/a>/);
});

test('dates, languages and JSON-LD', () => {
  assert.equal(dateLabel('2026-11-24'), 'November 24, 2026');
  assert.equal(dateLabel('2026-01-01T00:30:00+13:00'), 'January 1, 2026');
  assert.equal(dateLabel('soon'), '');
  assert.deepEqual(languageAttributes('en-US'), {});
  assert.deepEqual(languageAttributes('es'), { lang: 'es' });
  assert.deepEqual(languageAttributes('he-IL'), { lang: 'he-il', dir: 'rtl' });
  const script = jsonLdScript({ headline: '</script><script>alert(1)' }, 'https://myprogrampartner.com/blog/a');
  assert.ok(!script.includes('<'));
  assert.deepEqual(JSON.parse(script), { headline: '</script><script>alert(1)', url: 'https://myprogrampartner.com/blog/a', mainEntityOfPage: 'https://myprogrampartner.com/blog/a' });
  assert.deepEqual(JSON.parse(jsonLdScript({ url: 'https://example.org/x' }, 'https://example.org/y')), { url: 'https://example.org/x' });
  assert.equal(jsonLdScript({}, 'https://example.org/y'), '');
  assert.equal(jsonLdScript(null, 'https://example.org/y'), '');
});

test('reads every page of articles with the key as a query parameter only', async () => {
  const list = Array.from({ length: 120 }, (_, i) => raw(i));
  const f = fake(serve(list));
  const blog = await loadBlog(f.options);
  assert.equal(blog.articles.length, 120);
  assert.equal(blog.source, 'heycatch');
  const listCalls = f.calls.filter((u) => u.pathname === '/v1/articles');
  assert.deepEqual(listCalls.map((u) => u.searchParams.get('offset')), ['0', '50', '100']);
  for (const u of f.calls) { assert.equal(u.origin, 'https://api.heycatch.ai'); assert.equal(u.searchParams.get('key'), KEY); }
  const first = blog.articles[0];
  assert.equal(first.path, '/blog/post-0');
  assert.equal(first.publishedLabel, 'November 1, 2026');
  assert.equal(first.readTime, 5);
  assert.equal(first.description, 'Hidden description 0');
  assert.match(first.html, /Table of contents/);
  assert.doesNotMatch(first.html, /script|onclick/);
  assert.equal(JSON.parse(first.jsonLd).url, 'https://myprogrampartner.com/blog/post-0');
});

test('a failed read uses the last good copy, and an empty blog when there is none', async () => {
  let fail = false;
  const f = fake((url) => (fail ? json({}, 500) : serve([raw(1)])(url)));
  assert.equal((await loadBlog(f.options)).articles.length, 1);
  fail = true;
  const kept = await loadBlog(f.options);
  assert.equal(kept.source, 'cache');
  assert.equal(kept.articles[0].title, 'Post 1');

  for (const answer of [() => json({}, 401), () => json({}, 500), () => new Response('<html>'), () => json({ nope: 1 }), () => { throw new Error('network'); }]) {
    const blog = await loadBlog(fake(answer).options);
    assert.deepEqual(blog.articles, []);
    assert.equal(blog.version, 'empty');
  }
  // One article's page failing fails the whole read: no half-built blog.
  const half = fake((url) => (url.pathname.endsWith('/post-2') ? json({}, 500) : serve([raw(1), raw(2)])(url)));
  assert.deepEqual((await loadBlog(half.options)).articles, []);
});

test('a revoked key empties the blog; no key makes no call', async () => {
  const revoked = fake(() => json({}, 403));
  const blog = await loadBlog(revoked.options);
  assert.deepEqual(blog.articles, []);
  assert.equal(blog.source, 'heycatch');
  const none = fake(() => { throw new Error('must not be called'); });
  assert.deepEqual((await loadBlog({ ...none.options, apiKey: ' ' })).articles, []);
  assert.equal(none.calls.length, 0);
});

test('a rate limit is waited out once, never in a loop, and never for long', async () => {
  let answers = [json({}, 429, { 'retry-after': '2' })];
  const once = fake((url) => answers.shift() ?? serve([])(url));
  assert.equal((await fetchArticleList(once.options)).ok, true);
  assert.deepEqual(once.sleeps, [2000]);

  const twice = fake(() => json({}, 429, { 'retry-after': '1' }));
  assert.equal((await fetchArticleList(twice.options)).ok, false);
  assert.equal(twice.calls.length, 2);

  const long = fake(() => json({}, 429, { 'retry-after': '600' }));
  assert.equal((await fetchArticleList(long.options)).ok, false);
  assert.equal(long.calls.length, 1);
  assert.deepEqual(long.sleeps, []);
});

test('the version changes when an article is published, edited or removed', async () => {
  const list = async (items) => (await fetchArticleList(fake(serve(items)).options)).summaries;
  const base = blogVersion(await list([raw(1), raw(2)]));
  assert.equal(base, blogVersion(await list([raw(1), raw(2)])));
  assert.notEqual(base, blogVersion(await list([raw(1), raw(2), raw(3)])));
  assert.notEqual(base, blogVersion(await list([raw(1)])));
  assert.notEqual(base, blogVersion(await list([raw(1), raw(2, { updated_at: '2026-11-03T08:00:00Z' })])));
  assert.equal(blogVersion([]), 'empty');
});

test('a slug that could not be a file name is left out', async () => {
  const blog = await loadBlog(fake(serve([raw(1), raw(2, { slug: '../escape' }), raw(3, { slug: '.hidden' }), raw(4, { title: '' })])).options);
  assert.deepEqual(blog.articles.map((a) => a.slug), ['post-1']);
});

// ---- The built site ------------------------------------------------------------------------------------------
async function build(env) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-blog-site-'));
  await run(process.execPath, ['node_modules/@11ty/eleventy/cmd.cjs', '--output=' + output], { env: { ...process.env, HEYCATCH_API_KEY: '', ...env } });
  return { output, read: (p) => fs.readFileSync(path.join(output, p), 'utf8'), has: (p) => fs.existsSync(path.join(output, p)) };
}

test('with no key the blog is an empty page and nothing links to it', async () => {
  const site = await build({});
  try {
    assert.match(site.read('blog/index.html'), /<p class="lede">No articles yet\.<\/p>/);
    assert.equal(site.read('blog/version.txt'), 'empty\n');
    assert.ok(!site.read('index.html').includes('href="/blog/"'));
    assert.match(site.read('sitemap.xml'), /<loc>https:\/\/myprogrampartner\.com\/blog\/<\/loc>/);
  } finally { fs.rmSync(site.output, { recursive: true, force: true }); }
});

test('with articles the site has an index, a page per article, links and sitemap entries', async () => {
  const list = [raw(2, { title: 'Fees & "families"', language: 'ar' }), raw(1)];
  const server = http.createServer(async (req, res) => {
    const answer = serve(list)(new URL(req.url, 'http://localhost'));
    res.writeHead(answer.status, { 'content-type': 'application/json' });
    res.end(await answer.text());
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const site = await build({ HEYCATCH_API_KEY: KEY, HEYCATCH_API_BASE: `http://127.0.0.1:${server.address().port}/v1` });
  try {
    const index = site.read('blog/index.html');
    assert.match(index, /<h2><a href="\/blog\/post-2">Fees &amp; &quot;families&quot;<\/a><\/h2>/);
    assert.match(index, /<time datetime="2026-11-01">November 1, 2026<\/time><span aria-hidden="true"> · <\/span>5 min read/);
    assert.ok(index.indexOf('/blog/post-2') < index.indexOf('/blog/post-1'), 'HeyCatch order is kept');
    assert.ok(!index.includes('Hidden description'), 'no excerpt on the index');
    assert.match(site.read('index.html'), /<a href="\/blog\/">Blog<\/a>/);

    const post = site.read('blog/post-2.html');
    assert.equal(post.match(/<h1\b/g).length, 1);
    assert.match(post, /<title>Fees &amp; &quot;families&quot; \| Program Partner<\/title>/);
    assert.match(post, /<meta name="description" content="Hidden description 2">/);
    assert.match(post, /<meta property="og:description" content="Hidden description 2">/);
    assert.match(post, /<meta name="twitter:description" content="Hidden description 2">/);
    assert.match(post, /<meta property="og:type" content="article">/);
    assert.match(post, /<link rel="canonical" href="https:\/\/myprogrampartner\.com\/blog\/post-2">/);
    assert.match(post, /<script type="application\/ld\+json">\{"@type":"Article","url":"https:\/\/myprogrampartner\.com\/blog\/post-2"/);
    assert.match(post, /<article class="wrap-narrow stack" style="gap:22px" lang="ar" dir="rtl">/);
    assert.match(post, /<nav class="blog-toc"/);
    assert.doesNotMatch(post, /alert\(1\)|onclick="steal/);
    assert.equal(post.split('Hidden description 2').length - 1, 3, 'the description is in the head only');
    // Every other page keeps og:type website and its own canonical.
    assert.match(site.read('pricing/index.html'), /<meta property="og:type" content="website">/);
    assert.match(site.read('pricing/index.html'), /<link rel="canonical" href="https:\/\/myprogrampartner\.com\/pricing\/">/);

    const sitemap = site.read('sitemap.xml');
    assert.match(sitemap, /<loc>https:\/\/myprogrampartner\.com\/blog\/post-2<\/loc><lastmod>2026-11-02<\/lastmod>/);
    assert.match(sitemap, /<loc>https:\/\/myprogrampartner\.com\/blog\/post-1<\/loc>/);
    assert.ok(!sitemap.includes('.html</loc>') && !sitemap.includes('version.txt'));
    assert.match(site.read('blog/version.txt'), /^[0-9a-f]{16}\n$/);
  } finally { server.close(); fs.rmSync(site.output, { recursive: true, force: true }); }
});
