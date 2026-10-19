# Site checks

`python3 qa/audit.py` runs against a local build served at http://localhost:8787
(`npm run build && python3 -m http.server 8787 -d _site`). It needs Playwright for
Python with Chromium, and `axe-core` from devDependencies.

For every page in the sitemap plus the 404 it reports:
- axe-core violations (WCAG 2.0 A/AA and 2.1 AA)
- title and description lengths, h1 count, heading-level skips, images without alt
- internal links that don't resolve in the build
- JavaScript errors on load
- horizontal overflow at 360, 768 and 1280 px wide

A clean run prints `clean` for every page.
