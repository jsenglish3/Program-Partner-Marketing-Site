# Program Partner marketing site

Source for **myprogrampartner.com**. A static site built with [Eleventy](https://www.11ty.dev/) from the Claude Design canvas, published to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`).

## Working on it

```
npm install
npm start        # local preview at http://localhost:8080
npm run build    # writes the site to _site/
```

## Where things live

| What | Where |
| --- | --- |
| Pages | `src/*.njk` — one file per page; `feature.njk`, `audience.njk` and `legal.njk` generate several pages each from data |
| Shared header, footer, layout | `src/_includes/` |
| Reusable sections (hero, CTA band, FAQ, steps, screenshot frames) | `src/_includes/macros.njk` |
| Site-wide settings (booking link, form endpoint, analytics token, CTA labels) | `src/_data/site.json` |
| Navigation | `src/_data/nav.json` |
| Feature page copy | `src/_data/features.js` |
| Audience page copy (directors, boosters, schools, studios) | `src/_data/audiences.json` |
| Privacy, terms, accessibility text | `src/_data/legal.json` |
| Styles and script | `src/assets/site.css`, `src/assets/site.js` |
| Screenshots | `src/screenshots/<slot>.png` — see below |

## Screenshots

Every screenshot frame on the site has a slot name. Drop a PNG, JPG or WebP named after the slot into `src/screenshots/` and it appears in that frame on the next build; until then the frame shows a quiet placeholder with the slot's description. Take them from the Westbrook demo school only.

Slot names: open any built page and look for `class="placeholder"` — the text inside is the description, and the slot name is the file to add. The main ones:

- Home hero: `home-hero-{all,band,orchestra,choir,theatre,studio}-{browser,phone}`
- Home: `home-woodshed`, `home-fam-parent`, `home-fam-student`
- Product: `product-fees`, `product-forms`, `product-events`
- Feature pages: `<feature>-how-0`, `<feature>-how-1`, `<feature>-how-2` (and `-how-3` for teaching), `feature-<feature>-phone`, plus `fees-walkthrough` and `seating-how-main`
- Families: `families-hero-browser`, `families-hero-phone`
- Woodshed: `woodshed-hero-browser`, `woodshed-hero-phone`, `woodshed-create`, `woodshed-share`, `woodshed-practice`, `woodshed-linked`

Browser frames are 16:10, tablet frames 1180×820, phone frames iPhone 15 shape (393×852, so 786×1704 at 2×). Phone shots already include the iPhone status bar, Dynamic Island and home indicator (`tools/iphone.py` adds them to a raw 390-wide capture); the frame adds the titanium edge and buttons. Anything else is cropped from the top-left.

Two extras:

- **Dark mode.** Add `<slot>-dark.webp` next to a home hero shot and the hero's Light/Dark switch shows it. Every home hero slot has one.
- **Animations.** Add `<slot>.mp4` (and optionally `<slot>.webm`) and the frame plays it as a short muted loop, with `<slot>.webp` as its poster. It plays only while on screen, has a pause button, and stays paused for visitors who ask for reduced motion. Current animations: `fees-walkthrough` (create a fee, a parent uploads a receipt, approve it), `teaching-how-2` (review a Skill Pathways submission and pass it) and `seating-how-main` (move a student on a concert chart; a taken chair swaps).

How the current set was taken: the Westbrook demo at app.myprogrampartner.com/demo, captured at 2× (desktop 1440×900, tablet 1180×820, phone 390×845) in both light and dark color schemes. The demo resets nightly, so retakes look the same.

## Settings in `src/_data/site.json`

- `bookingUrl` — the public booking page. While empty, "Schedule a demo" scrolls to the Let's chat form instead.
- `chatEndpoint` — where the Let's chat form posts (the app's `/api/public/demo-access-request`). Empty means preview mode: the form goes straight to the thank-you page.
- `turnstileSiteKey` — optional Cloudflare Turnstile widget on the form.
- `cloudflareAnalyticsToken` — optional Cloudflare Web Analytics beacon.

## Founder photo

Put the photo at `src/assets/trey-english.jpg` (portrait, roughly 2:3). The home and About pages show a placeholder until it exists.
