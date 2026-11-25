// The one-time move of myprogrampartner.com from GitHub Pages to Cloudflare (README: "Hosting"), run by deploy.yml
// before the Workers deploy. Owner's go-ahead, 24 November 2026.
//
//   node scripts/cloudflare-switch-over.mjs before    Deletes only the DNS records that point at GitHub Pages (the apex's
//                                                    A and AAAA records on GitHub's addresses, and www's CNAME to
//                                                    jsenglish3.github.io), saving them first, so the deploy can attach
//                                                    the Workers' custom domains. Everything else in the zone (mail,
//                                                    app., woodshed., verification records) is left alone. Turns on
//                                                    Always Use HTTPS. Once nothing points at GitHub, it does nothing.
//   node scripts/cloudflare-switch-over.mjs restore   If the deploy fails: puts the saved GitHub records back, so
//                                                    GitHub Pages serves the site again.
//
// Uses CLOUDFLARE_API_TOKEN (Zone Read, DNS Edit and Zone Settings Edit on the zone, besides the Workers permissions).
import fs from 'node:fs';

const API = 'https://api.cloudflare.com/client/v4';
const ZONE = 'myprogrampartner.com';
const NAMES = ['myprogrampartner.com', 'www.myprogrampartner.com'];
const SAVED = '.switch-over-records.json';
const GITHUB_A = new Set(['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153']);
const GITHUB_AAAA = /^2606:50c0:800[0-3]::153$/i;

export function pointsAtGitHub(r) {
  if (r.type === 'A') return GITHUB_A.has(r.content);
  if (r.type === 'AAAA') return GITHUB_AAAA.test(r.content);
  if (r.type === 'CNAME') return /^jsenglish3\.github\.io\.?$/i.test(r.content);
  return false;
}

async function cf(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const why = (body.errors || []).map((e) => `${e.code}: ${e.message}`).join('; ') || res.statusText;
    throw new Error(`${init.method || 'GET'} ${path} answered ${res.status} (${why})`);
  }
  return body.result;
}

async function zoneId() {
  const zones = await cf(`/zones?name=${ZONE}`);
  if (!zones.length) throw new Error(`the token can't see the ${ZONE} zone (it needs Zone Read on it)`);
  return zones[0].id;
}

async function before() {
  const zone = await zoneId();
  const records = [];
  for (const name of NAMES) records.push(...(await cf(`/zones/${zone}/dns_records?name=${name}&per_page=100`)));
  const github = records.filter(pointsAtGitHub);
  if (!github.length) {
    console.log('switch-over: nothing points at GitHub Pages any more; nothing to do.');
  } else {
    fs.writeFileSync(SAVED, JSON.stringify(github.map(({ type, name, content, ttl, proxied, comment }) => ({ type, name, content, ttl, proxied, comment })), null, 2));
    for (const r of github) {
      await cf(`/zones/${zone}/dns_records/${r.id}`, { method: 'DELETE' });
      console.log(`switch-over: deleted ${r.type} ${r.name} → ${r.content}`);
    }
  }
  const https = await cf(`/zones/${zone}/settings/always_use_https`);
  if (https.value !== 'on') {
    await cf(`/zones/${zone}/settings/always_use_https`, { method: 'PATCH', body: JSON.stringify({ value: 'on' }) });
    console.log('switch-over: turned on Always Use HTTPS.');
  } else {
    console.log('switch-over: Always Use HTTPS was already on.');
  }
}

async function restore() {
  if (!fs.existsSync(SAVED)) {
    console.log('switch-over: no records were deleted in this run; nothing to put back.');
    return;
  }
  const zone = await zoneId();
  // One at a time, carrying on past a failure: if the apex was already attached to its Worker, its GitHub records
  // can't come back (and needn't), but www's still can.
  for (const r of JSON.parse(fs.readFileSync(SAVED, 'utf8'))) {
    try {
      await cf(`/zones/${zone}/dns_records`, { method: 'POST', body: JSON.stringify(r) });
      console.log(`switch-over: put back ${r.type} ${r.name} → ${r.content}`);
    } catch (e) {
      console.log(`switch-over: couldn't put back ${r.type} ${r.name} → ${r.content}: ${e.message}`);
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('cloudflare-switch-over.mjs')) {
  const cmd = process.argv[2];
  if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error('CLOUDFLARE_API_TOKEN is not set');
  if (cmd === 'before') await before();
  else if (cmd === 'restore') await restore();
  else throw new Error('usage: cloudflare-switch-over.mjs before | restore');
}
