# Program Partner marketing site

Source for **myprogrampartner.com**. A static site built with [Eleventy](https://www.11ty.dev/) from the Claude Design canvas, published to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`).

## Working on it

```
npm install
npm start        # local preview at http://localhost:8080
npm run build    # writes the site to _site/
```

## Staging review copy

Changes are reviewed on the Cloudflare Pages project `program-partner-marketing-staging` (https://program-partner-marketing-staging.pages.dev) before they reach `main`. Production stays on GitHub Pages and is never touched by this.

```
npm ci
npm run build:staging   # _site/, then a review copy in _staging/
npx wrangler pages deploy _staging --project-name program-partner-marketing-staging --branch staging
```

`scripts/prepare-staging.mjs` makes the review copy: every page is `noindex`, the content editor and `CNAME` are left out, the contact form posts nowhere, and app links point to the staging app. Upload only `_staging/`, never `_site/`.

## Where things live

| What | Where |
| --- | --- |
| Pages | `src/*.njk` — one file per page; `feature.njk`, `audience.njk` and `legal.njk` generate several pages each from data |
| Shared header, footer, layout | `src/_includes/` |
| Reusable sections (hero, CTA band, FAQ, steps, screenshot frames) | `src/_includes/macros.njk` |
| Site-wide settings (booking link, form endpoint, analytics token, CTA labels) | `src/_data/site.json` |
| Navigation | `src/_data/nav.json` |
| Feature page copy | `content/features/` |
| Audience page copy (directors, boosters, schools, studios) | `content/audiences/` |
| Privacy, terms, accessibility text | `content/legal/` |
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

**Phone-sized copies.** The build also writes smaller WebP copies of every screenshot (400, 800 and 1200 px wide, whichever are narrower than the original) to `/screenshots/w/`, and the frames list them in `srcset`, so a phone downloads a phone-sized file. Nothing to do by hand: add or replace a screenshot and the next build makes its copies (`scripts/responsive-images.mjs`, cached in `.cache/responsive/`). The first home hero shot loads straight away; everything else loads as it nears the screen.

## Blog

The blog at `/blog/` is written and published in HeyCatch, not here. The build reads the published articles from HeyCatch's API (`scripts/blog.mjs`, following https://heycatch.ai/blog-agents.md) and writes `/blog/` (title, date and read time of each) and one page per article at `/blog/<slug>`. There is no article text in this repository.

- **The key.** `HEYCATCH_API_KEY` is HeyCatch's read-only blog key (`hck_lv_…`), a repository secret under Settings → Secrets and variables → Actions. It is not the `hck_pk_…` analytics key in `base.njk`. For a local build, put `HEYCATCH_API_KEY=…` in the environment (`HEYCATCH_API_KEY=… npm start`). Without it the blog builds empty: `/blog/` says "No articles yet." and the Blog links in the header and footer stay hidden. Pull request builds and the staging copy have no key unless you give them one.
- **New articles.** `.github/workflows/blog-check.yml` asks HeyCatch every 15 minutes whether its articles differ from the ones the live site was built from (`/blog/version.txt`) and starts the deploy only when they do. So a published or edited article is live within about 20 minutes, and nothing is deployed when nothing changed.
- **When HeyCatch can't be reached.** The check does nothing, so the live site keeps its articles. A build that can't read HeyCatch uses the last good copy the deploy keeps (`.cache/heycatch/`, an Actions cache) and otherwise builds an empty blog; it never fails the build.
- **What an article page is.** HeyCatch's HTML, in order, through an allowlist that drops scripts, styles, frames and event handlers; a "Table of contents" after the Key takeaways; the title, description, canonical address and HeyCatch's structured data in the head. Articles are written to `blog/<slug>.html`, which GitHub Pages serves at `/blog/<slug>`.

## Proof, profiles and what's new

These fill in through the content editor and stay hidden until something real goes in them. Never fill them for show.

- **Customer quotes** (Home → Customer quotes): a quote wall after "Your money stays yours". Each quote has a first name, role, program and an optional photo, and needs the customer's permission. The usage line ("14 programs run on Program Partner") shows on its own once filled in.
- **Mentioned in** (Home → Mentioned in): a slim dated strip under the founder story, for outside mentions such as an association newsletter, a directory listing or a review profile. The date is the month it ran (YYYY-MM).
- **Profile links** (About → Meet the team → each person → Professional profile link): shows on the team card, in the footer beside Facebook and Instagram, and in the site's Organization data (the founder as founder, everyone else as a member).
- **What's new** (`/changelog/`, What's new in the editor): dated entries, newest first. Each has a stable anchor from its date and title. Linked from Resources and the footer.
- **`/llms.txt`** (`src/llms.11ty.js`): a plain-text map of the site for AI assistants, built from the same prices, page descriptions and What's new entries, so it changes with them.

## Demo school instead of a trial

There is no free trial (owner decision, 24 November 2026). "Explore the demo school" on the school price card and the subscribe page links to the app's own `/demo` page, where a visitor asks for access and gets a link by email once it's approved by hand. The site's Let's chat form still never gives demo access.

## Settings in `src/_data/site.json`

- `bookingUrl` — the public booking page. While empty, "Schedule a demo" scrolls to the Let's chat form instead.
- `chatEndpoint` — where the Let's chat form posts (the app's `/api/public/demo-access-request`). Despite the path, the app treats it as a contact form: it saves the visitor as a prospect and emails support@ their message. It never gives demo access (24 October 2026). Empty means preview mode: the form goes straight to the thank-you page. The app accepts only the fields in its `demoAccessRequestSchema` (`src/lib/demo-access.ts` in programhq-fmms) and only from https://myprogrampartner.com and https://www.myprogrampartner.com, so the form can't be tested from a preview address. If you change the form's fields or role list, change the app's schema to match.
- `turnstileSiteKey` — optional Cloudflare Turnstile widget on the form. The app doesn't check Turnstile yet, so the token isn't sent; leave this empty until it does.
- `cloudflareAnalyticsToken` — optional Cloudflare Web Analytics beacon.

## Founder photo

Put the photo at `src/assets/trey-english.jpg` (portrait, roughly 2:3). The home and About pages show a placeholder until it exists.

## Visual content editor

The Decap content editor is implemented at `/admin/` with a live preview and separate draft/publish workflow. **It is not activated until the dedicated GitHub App and Cloudflare OAuth Worker secrets are configured.** See [setup, editing instructions and verification status](docs/content-editor.md).

Content lives in `content/` JSON files, with thin Eleventy data loaders in `src/_data/`. The existing templates, Cabin typography (docs/TYPOGRAPHY.md), CSS, scripts and GitHub Pages deployment remain in place. Run `npm run build` and `npm test` for the editor checks.

## Pricing and the subscribe page

The price is $299 a year per program (the founding price) for programs that subscribe by June 30, 2027, kept every year they renew, then $349 a year. The words are in `content/copy/pricing.json` and `content/copy/subscribe.json` (both in the content editor). What the editor must not change lives in `src/_data/pricing.js`:

- `founding` switches from the founding to the standard wording at the start of July 1, 2027, Eastern time (`2027-07-01T04:00:00Z`). The site only changes when it's rebuilt, so `deploy.yml` also runs on a schedule at 04:05 UTC on July 1. GitHub turns scheduled workflows off in a public repository after 60 days without a commit, so check the pricing page that morning and run the deploy by hand if it didn't run.
- `checkout.founding` and `checkout.standard` are Stripe Payment Links on the Program Partner, LLC account. An empty link sends Subscribe to the Let's chat form with Pricing checked. The $349 link isn't set yet.
- Private studios have their own plan and their own deadline, under `studio`. The founding price is $19 a month or $190 a year for studios that subscribe by December 31, 2026; from January 1, 2027 it's $24 a month or $240 a year.
  - `studio.founding` switches at the start of January 1, 2027, Eastern time (`2027-01-01T05:00:00Z`), and `deploy.yml` also runs at 05:05 UTC on January 1.
  - Between January 1 and June 30, 2027 the Pricing page shows schools' founding price and studios' standard price, with the hero's `subhead_school_founding`.
  - `studio.checkout` holds both pairs of studio links, all set.
- Build as another moment with `PRICING_NOW=2027-07-01T00:00:00-04:00 npm run build`; `tests/pricing.test.mjs` builds both sides of each deadline.

The staging review copy points every Subscribe button back at the page (`scripts/prepare-staging.mjs`), so nobody pays from a review copy.
