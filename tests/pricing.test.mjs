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

test('private studios see their founding plan, $19 a month or $190 a year, until the last minute of 31 December 2026, Eastern', () => {
  const b = buildAt('2026-12-31T23:59:00-05:00');
  try {
    const pricing = b.page('pricing');
    const subscribe = b.page('subscribe');
    assert.match(pricing, /data-price-tier="founding"/);
    assert.match(pricing, /data-price-tier="studio-founding"/);
    assert.match(text(pricing), /\$19 a month or \$190 a year/);
    assert.match(text(pricing), /Subscribe by December 31, 2026 and keep this price/);
    assert.match(text(pricing), /a private studio that subscribes by December 31, 2026/);
    assert.match(text(pricing), /A private studio that subscribes by December 31, 2026 pays \$19 a month or \$190 a year on the same terms/);
    assert.match(pricing, /href="\/subscribe\/#studio"/);
    assert.match(pricing, /"price":"299\.00","priceValidUntil":"2027-06-30"/);
    assert.match(pricing, /"price":"19\.00","priceValidUntil":"2026-12-31"[^}]*"billingDuration":"P1M"/);
    assert.match(pricing, /"price":"190\.00","priceValidUntil":"2026-12-31"/);
    // The subscribe page sends a studio straight to its own monthly and yearly founding checkout links.
    assert.match(subscribe, /id="studio"/);
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/6oUaEWbkZ3FSg27aa22sM03" class="btn btn-primary" data-studio-checkout="monthly"/);
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/3cI9AS2Ot2BO9DJ6XQ2sM04" class="btn btn-outline" data-studio-checkout="yearly"/);
    assert.match(text(subscribe), /through the month or year you paid for/);
    // The school checkout is still its own link.
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/3cI9AS74J3FS2bh1Dw2sM02" class="btn btn-primary" data-checkout-link/);
    // The studios page points to the price without a date that can go stale.
    assert.match(text(b.page('studios')), /Private studios have their own plan, billed monthly or yearly/);
    // The Terms give the studio plan its own dates.
    const terms = text(b.page('terms'));
    assert.match(terms, /A studio that subscribes by December 31, 2026 pays the founding price of \$19 a month or \$190 a year/);
    assert.match(terms, /Studios that subscribe from January 1, 2027 pay \$24 a month or \$240 a year/);
    assert.doesNotMatch(terms, /studio that subscribes by June 30, 2027/);
  } finally {
    fs.rmSync(b.output, { recursive: true, force: true });
  }
});

test('from the start of 1 January 2027, Eastern, a studio sees $24 a month or $240 a year while a school keeps $299', () => {
  const b = buildAt('2027-01-01T00:00:00-05:00');
  try {
    const pricing = b.page('pricing');
    const subscribe = b.page('subscribe');
    // Schools are still on the founding price.
    assert.match(pricing, /data-price-tier="founding"/);
    assert.match(text(pricing), /\$299 per program, per year/);
    assert.match(pricing, /"price":"299\.00","priceValidUntil":"2027-06-30"/);
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/3cI9AS74J3FS2bh1Dw2sM02" class="btn btn-primary" data-checkout-link/);
    // Studios are on the standard price.
    assert.match(pricing, /data-price-tier="studio-standard"/);
    assert.match(text(pricing), /\$24 a month or \$240 a year/);
    assert.match(text(pricing), /or \$24 a month for a private studio\. Every feature included\./);
    assert.doesNotMatch(text(pricing), /\$19 a month/);
    assert.doesNotMatch(text(pricing), /December 31, 2026/);
    assert.match(pricing, /"price":"24\.00","availability"/);
    assert.match(pricing, /"price":"240\.00","availability"/);
    // The founding question stays for schools, without the studio sentence.
    assert.match(text(pricing), /Subscribe by June 30, 2027 and you pay \$299 a year/);
    // The subscribe page sends a studio to the $24 and $240 checkout links.
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/dRm8wOagVfoAcPVgyq2sM05" class="btn btn-primary" data-studio-checkout="monthly"/);
    assert.match(subscribe, /href="https:\/\/buy\.stripe\.com\/00w6oG88Ndgsg273LE2sM06" class="btn btn-outline" data-studio-checkout="yearly"/);
    assert.doesNotMatch(subscribe, /6oUaEWbkZ3FSg27aa22sM03|3cI9AS2Ot2BO9DJ6XQ2sM04/);
  } finally {
    fs.rmSync(b.output, { recursive: true, force: true });
  }
});

test('from 1 July 2027 a studio still sees $24 a month or $240 a year, and no page offers a founding price', () => {
  const b = buildAt('2027-07-01T00:00:00-04:00');
  try {
    const pricing = b.page('pricing');
    const subscribe = b.page('subscribe');
    assert.match(pricing, /data-price-tier="studio-standard"/);
    assert.match(text(pricing), /\$24 a month or \$240 a year/);
    assert.match(pricing, /"price":"24\.00"/);
    assert.doesNotMatch(pricing, /priceValidUntil/);
    assert.match(subscribe, /data-studio-checkout="monthly"/);
    assert.doesNotMatch(text(pricing), /Founding price/);
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
