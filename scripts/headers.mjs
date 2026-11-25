// _headers: the security headers for a host that reads a headers file (Cloudflare Pages, Netlify). Written after each
// build (eleventy.config.js) so the policy allows exactly the inline scripts the pages carry, by their hashes.
//
// GitHub Pages, where myprogrampartner.com is served today, ignores this file and can't send headers of its own: these
// take effect on the staging copy (Cloudflare Pages) now, and on the live site once it is served from a host that
// reads them, or through a proxy that adds them (README: "Security headers").
//
// The Content-Security-Policy is report-only for now: browsers log what it would block in the console and block
// nothing. Once a week of browsing the staging copy shows no reports, rename it to Content-Security-Policy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Where the pages load things from: HeyCatch analytics (esm.sh, in.heycatch.ai), the Cloudflare Web Analytics beacon,
// the optional Turnstile check on the Let's chat form, and the app, which receives the form.
const csp = (scriptHashes) => [
  "default-src 'self'",
  `script-src 'self' ${scriptHashes.map((h) => `'${h}'`).join(' ')} https://esm.sh https://static.cloudflareinsights.com https://challenges.cloudflare.com`.replace(/\s+/g, ' '),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self' https://app.myprogrampartner.com https://in.heycatch.ai https://esm.sh https://cloudflareinsights.com",
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'self'",
  "form-action 'self' https://app.myprogrampartner.com",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

// sha256 hashes of every inline script the browser runs (JSON-LD is data, not run, so it needs none).
export function inlineScriptHashes(outputDir) {
  const hashes = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (path.relative(outputDir, p) !== 'admin') walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        const attrs = m[1];
        if (/\ssrc=/.test(attrs)) continue;
        const type = (attrs.match(/\stype="([^"]*)"/) || [])[1];
        if (type && !/^(module|text\/javascript)$/i.test(type)) continue;
        hashes.add('sha256-' + crypto.createHash('sha256').update(m[2], 'utf8').digest('base64'));
      }
    }
  };
  walk(outputDir);
  return [...hashes].sort();
}

export function writeHeaders(outputDir) {
  const lines = [
    '# Written by scripts/headers.mjs on every build. Read by Cloudflare Pages (the staging copy); GitHub Pages ignores it.',
    '/*',
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: SAMEORIGIN',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    `  Content-Security-Policy-Report-Only: ${csp(inlineScriptHashes(outputDir))}`,
    '',
    '# The content editor loads its own scripts and talks to GitHub: the site policy is not for it.',
    '/admin/*',
    '  ! Content-Security-Policy-Report-Only',
    '',
  ];
  // Cloudflare reads at most 2,000 characters a line and 100 rules: a longer policy would be dropped without a word.
  const long = lines.find((l) => l.length > 2000);
  if (long) throw new Error(`_headers: a line is ${long.length} characters, over Cloudflare's 2,000: ${long.slice(0, 80)}…`);
  fs.writeFileSync(path.join(outputDir, '_headers'), lines.join('\n'));
}
