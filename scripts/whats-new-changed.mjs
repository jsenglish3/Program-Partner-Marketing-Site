// For the deploy workflow's check: has Program Partner's What's new list changed since the live site was built?
// Compares the version of the list (scripts/whats-new.mjs, whatsNewVersion) with /changelog/version.txt on the live
// site and writes changed=true|false to $GITHUB_OUTPUT. If the list or the live site can't be read, the answer is
// false: the site stays as it is, and the next check tries again.
import fs from 'node:fs';
import { fetchWhatsNew, whatsNewVersion } from './whats-new.mjs';

const site = JSON.parse(fs.readFileSync(new URL('../src/_data/site.json', import.meta.url), 'utf8'));

async function changed() {
  const list = await fetchWhatsNew();
  if (!list) return [false, "Program Partner's list could not be read"];
  const now = whatsNewVersion(list);
  let live;
  try {
    const res = await fetch(`${process.env.WHATS_NEW_LIVE_ORIGIN || site.url}/changelog/version.txt`, { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
    if (res.status === 404) live = 'none';
    else if (res.ok) live = (await res.text()).trim();
    else return [false, `the live site answered ${res.status}`];
  } catch {
    return [false, 'the live site could not be read'];
  }
  return [live !== now, `live ${live}, Program Partner ${now}`];
}

const [answer, why] = await changed();
console.log(`What's new changed: ${answer} (${why})`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${answer}\n`);
