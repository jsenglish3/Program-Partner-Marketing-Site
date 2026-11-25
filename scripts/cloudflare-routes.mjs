// Who answers myprogrampartner.com and www.myprogrampartner.com on Cloudflare (README: "Hosting").
//
//   node scripts/cloudflare-routes.mjs          Lists every Worker route and custom domain on the zone.
//   node scripts/cloudflare-routes.mjs --fix    Also removes the routes and custom domains on those two names that
//                                               belong to any Worker other than the site's own (program-partner-site
//                                               and program-partner-www), such as one made by a Cloudflare dashboard Git
//                                               connection, which would run in front of them. No Worker is deleted.
//
// Run by .github/workflows/cloudflare-routes.yml with the CLOUDFLARE_API_TOKEN secret.
const API = 'https://api.cloudflare.com/client/v4';
const ACCOUNT = 'dad12c2149e6112b958637b2ece5cb5b';
const ZONE = 'myprogrampartner.com';
const OURS = new Set(['program-partner-site', 'program-partner-www']);
const NAMES = new Set(['myprogrampartner.com', 'www.myprogrampartner.com']);

async function cf(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(`${init.method || 'GET'} ${path} answered ${res.status} (${(body.errors || []).map((e) => `${e.code}: ${e.message}`).join('; ')})`);
  return body.result;
}

// The host a route pattern applies to: "www.myprogrampartner.com/*" → "www.myprogrampartner.com"; "*myprogrampartner.com/*" covers both.
export const routeHosts = (pattern) => {
  const host = pattern.split('/')[0].toLowerCase();
  if (host.startsWith('*')) return [...NAMES].filter((n) => n.endsWith(host.slice(1)));
  return NAMES.has(host) ? [host] : [];
};

const fix = process.argv.includes('--fix');
const zone = (await cf(`/zones?name=${ZONE}`))[0].id;
const routes = await cf(`/zones/${zone}/workers/routes`);
const domains = (await cf(`/accounts/${ACCOUNT}/workers/domains?zone_id=${zone}`)) || [];
console.log('Routes:');
for (const r of routes) console.log(`  ${r.pattern} → ${r.script || '(no Worker)'}`);
console.log('Custom domains:');
for (const d of domains) console.log(`  ${d.hostname} → ${d.service}`);
// Only routes written for exactly one of the two names are removed. A wildcard route that also covers them (it could
// carry app. or woodshed.) is only reported, to be looked at by hand.
const exact = (r) => NAMES.has(r.pattern.split('/')[0].toLowerCase());
const strayRoutes = routes.filter((r) => exact(r) && !OURS.has(r.script));
for (const r of routes.filter((r) => !exact(r) && routeHosts(r.pattern).length && !OURS.has(r.script))) {
  console.log(`Check by hand (wildcard, not removed): ${r.pattern} → ${r.script}`);
}
const strayDomains = domains.filter((d) => NAMES.has(d.hostname) && !OURS.has(d.service));
if (!strayRoutes.length && !strayDomains.length) console.log('Nothing else answers myprogrampartner.com or www.');
for (const r of strayRoutes) {
  if (fix) { await cf(`/zones/${zone}/workers/routes/${r.id}`, { method: 'DELETE' }); console.log(`Removed route ${r.pattern} → ${r.script}`); }
  else console.log(`Would remove route ${r.pattern} → ${r.script}`);
}
for (const d of strayDomains) {
  if (fix) { await cf(`/accounts/${ACCOUNT}/workers/domains/${d.id}`, { method: 'DELETE' }); console.log(`Removed custom domain ${d.hostname} → ${d.service}`); }
  else console.log(`Would remove custom domain ${d.hostname} → ${d.service}`);
}
