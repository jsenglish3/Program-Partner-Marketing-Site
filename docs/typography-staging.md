# Cabin + Lora staging — 1 November 2026

Trey approved Cabin headings/interface text and Lora longer reading copy,
and authorized staging only. This branch changes the self-hosted faces and
role tokens; the supplied SVG logo, palette, content, and layout scale remain.
`--font-serif` is retained as a legacy heading-role alias for Cabin;
`--font-reading` is Lora for paragraph, founder, FAQ-answer and legal reading
roles. Tables, menus, controls and metadata remain Cabin. Existing raster
screenshots and prerecorded videos retain the typography captured in them.

Both families are SIL OFL 1.1 variable WOFF2 fonts (400–700, normal/italic,
Latin/Latin Extended). Their licenses and exact source URLs/ranges ship in
`src/assets/fonts/`. Production currently remains Newsreader/DM Sans.

## Rebuild the review copy

Run `npm ci`, `npm run build:staging`, and `npm test`. The review build is in
`_staging/`; the ordinary `_site/` build still contains the production editor
and endpoint settings. `scripts/prepare-staging.mjs` packages a separate copy:
no indexing, no content editor, no live contact endpoint, and app links to
`https://program-partner-staging.jsenglish3.workers.dev`. No production DNS or
GitHub Pages deployment is changed.

Deploy `_staging/` with Wrangler Pages to project
`program-partner-marketing-staging`, branch `staging`. Never upload `_site/`
as this review copy. The stable preview address is
https://program-partner-marketing-staging.pages.dev.

The canonical cross-product typography record and Claude handoff are in
`jsenglish3/programhq-fmms`,
`docs/design-system/typography-cabin-staging-2026-11-01.md`.
Production release remains pending actual-screen review and authorization.

Cabin supersedes the earlier Urbanist staging proof after Trey preferred it on the comparison sheet. Lora remains a preview choice for longer reading copy, not a final secondary-font approval.
