import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Build the site as if it were a given moment (PRICING_NOW, read by src/_data/pricing.js).
function buildAt(moment) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-pricing-'));
  execFileSync(process.execPath, ['node_modules/@11ty/eleventy/cmd.cjs', '--output=' + output], {
    stdio: 'pipe',
    env: { ...process.env, PRICING_NOW: moment },
  });
  const page = (url) => fs.readFileSync(path.join(output, url, 'index.html'), 'utf8');
  const all = () => {
    const out = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== 'admin') walk(p); } else if (e.name.endsWith('.html')) out.push(fs.readFileSync(p, 'utf8'));
      }
    };
    walk(output);
    return out.join('\n');
  };
  return { output, page, all };
}

const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ');

test('the founding price shows until the last minute of 30 June 2027, Eastern', () => {
  const b = buildAt('2027-06-30T23:59:00-04:00');
  try {
    const pricing = b.page('pricing');
    const subscribe = b.page('subscribe');
    assert.match(pricing, /data-price-tier="founding"/);
    assert.match(text(pricing), /Founding price/);
    assert.match(text(pricing), /\$299 per program, per year/);
    assert.match(text(pricing), /What does "founding price" mean\?|What does &quot;founding price&quot; mean\?/);
    assert.match(pricing, /"price":"299\.00","priceValidUntil":"2027-06-30"/);
    // Subscribe goes to the live founding checkout link.
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/[^"]+" class="btn btn-primary" data-checkout-link/);
    assert.match(text(subscribe), /keeps the founding price/);
  } finally {
    fs.rmSync(b.output, { recursive: true, force: true });
  }
});

test('from the start of 1 July 2027, Eastern, the site shows $349 and no founding offer', () => {
  const b = buildAt('2027-07-01T00:00:00-04:00');
  try {
    const pricing = b.page('pricing');
    const subscribe = b.page('subscribe');
    assert.match(pricing, /data-price-tier="standard"/);
    assert.match(text(pricing), /\$349 per program, per year/);
    assert.doesNotMatch(text(pricing), /Founding price/);
    assert.doesNotMatch(text(pricing), /What does .founding price. mean/);
    assert.doesNotMatch(pricing, /priceValidUntil/);
    assert.match(pricing, /"price":"349\.00"/);
    assert.doesNotMatch(text(subscribe), /keeps the founding price/);
    // No $349 checkout link is set yet, so Subscribe falls back to the Let's chat form.
    if (!/data-checkout-link/.test(subscribe)) assert.match(subscribe, /href="\/demo\/\?topic=pricing#chat" class="btn btn-primary"/);
  } finally {
    fs.rmSync(b.output, { recursive: true, force: true });
  }
});

test('private studios see their own plan: $19 a month or $190 a year until 1 July 2027', () => {
  const b = buildAt('2027-06-30T23:59:00-04:00');
  try {
    const pricing = b.page('pricing');
    const subscribe = b.page('subscribe');
    assert.match(pricing, /data-price-tier="studio-founding"/);
    assert.match(text(pricing), /\$19 a month or \$190 a year/);
    assert.match(pricing, /href="\/subscribe\/#studio"/);
    assert.match(pricing, /"price":"19\.00","priceValidUntil":"2027-06-30"[^}]*"billingDuration":"P1M"/);
    assert.match(pricing, /"price":"190\.00","priceValidUntil":"2027-06-30"/);
    // The subscribe page sends a studio straight to its own monthly and yearly checkout links.
    assert.match(subscribe, /id="studio"/);
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/6oUaEWbkZ3FSg27aa22sM03" class="btn btn-primary" data-studio-checkout="monthly"/);
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/3cI9AS2Ot2BO9DJ6XQ2sM04" class="btn btn-outline" data-studio-checkout="yearly"/);
    assert.match(text(subscribe), /through the month or year you paid for/);
    // The school checkout is still its own link.
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/3cI9AS74J3FS2bh1Dw2sM02" class="btn btn-primary" data-checkout-link/);
    // The studios page points to the price without a date that can go stale.
    assert.match(text(b.page('studios')), /Private studios have their own plan, billed monthly or yearly/);
  } finally {
    fs.rmSync(b.output, { recursive: true, force: true });
  }
});

test('from 1 July 2027 a studio sees $24 a month or $240 a year, and no founding offer', () => {
  const b = buildAt('2027-07-01T00:00:00-04:00');
  try {
    const pricing = b.page('pricing');
    const subscribe = b.page('subscribe');
    assert.match(pricing, /data-price-tier="studio-standard"/);
    assert.match(text(pricing), /\$24 a month or \$240 a year/);
    assert.match(pricing, /"price":"24\.00"/);
    assert.doesNotMatch(subscribe, /data-studio-checkout/);
    // No $24 / $240 links yet, so the studio card falls back to the Let's chat form.
    assert.match(subscribe, /id="studio"[\s\S]*href="\/demo\/\?topic=pricing#chat" class="btn btn-primary"/);
  } finally {
    fs.rmSync(b.output, { recursive: true, force: true });
  }
});

test('no page still says every program is quoted', () => {
  const b = buildAt('2026-11-07T12:00:00-05:00');
  try {
    const site = text(b.all());
    for (const phrase of [/Every program gets its own quote/i, /Why don't you list prices/i, /We quote each program/i, /A quote takes one business day/i, /Each program gets its own quote/i, /Request a quote/i, /quoted to fit each program/i, /We quote each Program/]) {
      assert.doesNotMatch(site, phrase);
    }
    assert.match(b.page('subscribe/thanks'), /name="robots" content="noindex/);
    assert.doesNotMatch(fs.readFileSync(path.join(b.output, 'sitemap.xml'), 'utf8'), /subscribe\/thanks/);
  } finally {
    fs.rmSync(b.output, { recursive: true, force: true });
  }
});

test('the staging review copy never links to live checkout', () => {
  const s = fs.readFileSync('scripts/prepare-staging.mjs', 'utf8');
  assert.match(s, /buy\\\.stripe\\\.com/);
});
