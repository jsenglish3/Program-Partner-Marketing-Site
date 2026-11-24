// For the deploy workflow's blog check: has the blog in HeyCatch changed since the live site was built?
// Compares the version of HeyCatch's article list with /blog/version.txt on the live site and writes
// changed=true|false to $GITHUB_OUTPUT. If HeyCatch or the live site can't be read, the answer is false:
// the site stays as it is, with its last good articles, and the next check tries again.
import fs from 'node:fs';
import { blogVersion, fetchArticleList, HEYCATCH_API_BASE } from './blog.mjs';

const site = JSON.parse(fs.readFileSync(new URL('../src/_data/site.json', import.meta.url), 'utf8'));

async function changed() {
  const apiKey = String(process.env.HEYCATCH_API_KEY || '').trim();
  if (!apiKey) return [false, 'HEYCATCH_API_KEY is not set'];
  const list = await fetchArticleList({ apiKey, baseUrl: process.env.HEYCATCH_API_BASE || HEYCATCH_API_BASE });
  if (!list.ok) return [false, 'HeyCatch could not be read'];
  const now = blogVersion(list.summaries);
  let live;
  try {
    const res = await fetch(`${process.env.BLOG_LIVE_ORIGIN || site.url}/blog/version.txt`, { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
    if (res.status === 404) live = 'none';
    else if (res.ok) live = (await res.text()).trim();
    else return [false, `the live site answered ${res.status}`];
  } catch {
    return [false, 'the live site could not be read'];
  }
  return [live !== now, `live ${live}, HeyCatch ${now}`];
}

const [answer, why] = await changed();
console.log(`Blog changed: ${answer} (${why})`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${answer}\n`);
