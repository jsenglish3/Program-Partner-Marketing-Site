# Cabin typography — Program Partner and Woodshed

**Status: Approved by the product owner, 4 November 2026 — implementation in review.**
Cabin is the one typeface for Program Partner (app and console), Woodshed and the
myprogrampartner.com marketing site: interface text, headings, navigation,
buttons, forms, tables, dialogs, display numerals and generated reports. It
replaces Newsreader + DM Sans (Program Partner, marketing site) and Fraunces +
DM Sans (Woodshed). Logos and wordmarks stay supplied outlined artwork; never
set a logo in Cabin.

This file is identical in every repository. Change it in all three at once.

## Families (tokens)

| Token            | Stack                                                                                       | Use                                                          |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `--font-sans`    | `"Cabin", "Cabin Fallback", ui-sans-serif, system-ui, sans-serif`                           | Everything by default: body, navigation, buttons, forms, tables, dialogs |
| `--font-heading` | same as `--font-sans`                                                                       | Heading roles and display numerals. A separate token so a future heading face is a one-line change |
| `--font-numeric` | `"Cabin Figures", "Cabin", "Cabin Fallback", ui-sans-serif, system-ui, sans-serif`          | Any element with tabular numerals (`tabular-nums`): money, counts, scores, times in columns |
| `--font-mono`    | `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`               | Code, codes people type back (join codes, one-time codes, result codes), raw data. Cabin's zero is as round as its O, so codes stay monospace on screen and in PDFs (Courier) |

Kept on purpose (Cabin must never be placed ahead of these):

- **Music notation and musical symbols:** Noto Music (Woodshed) for clefs,
  notes, accidentals and ♩-style note values. Where a line mixes words and a
  note value, put Cabin first and Noto Music second so Cabin sets the words and
  Noto Music draws only what Cabin lacks.
- **Engraved music text:** time-signature digits and italic score words
  (Fine, D.C., D.S., *rit.*) keep Georgia, as printed music sets them.
- **Phonetic (IPA) text:** a system font with full IPA coverage. Cabin has no
  IPA, and a word must never mix two faces.
- **Icons:** SVG icon sets; no icon font is used.
- **Email:** `Arial, Helvetica, sans-serif` and the existing monospace code
  styles. Mail clients drop web fonts, so emails do not load Cabin.
- **Signed records and filled third-party PDFs** (pdf-lib): see "Generated
  documents".

## Files and loading

Self-hosted from each site's own origin; no third-party font host at runtime.

| File                                   | Face                            | Loaded when                                                   |
| -------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| `cabin-latin-normal.woff2` (27.6 KiB)  | Cabin, variable wght 400–700    | Every page. The only preloaded font                           |
| `cabin-latin-ext-normal.woff2`         | Cabin, Latin Extended           | Only when a page shows Latin Extended letters (`unicode-range`) |
| `cabin-latin-italic.woff2`, `cabin-latin-ext-italic.woff2` | Cabin Italic, wght 400–700 | Only when italic text renders                       |
| `cabin-figures-{400,500,600,700}.woff2` (≈1.4 KiB each) | Cabin Figures, digits only | Only weights a tabular-number element actually uses |
| `cabin-pdf-{regular,bold}.ttf`         | Cabin 400 / 700, static         | Never by a web page; embedded into generated PDFs             |

Every `@font-face` uses `font-display: swap`. Cabin and Cabin Italic declare
`font-weight: 400 700` (one variable file, real weights; never synthesized).
Cabin Figures declares one weight per file and
`unicode-range: U+0030-0039`, so it supplies digits only and Cabin supplies
everything else.

**Fallback and layout shift.** `Cabin Fallback` is a local system face
adjusted to Cabin's metrics, so text set in the fallback occupies nearly the
same space and the swap does not reflow the page:

```css
@font-face {
  font-family: "Cabin Fallback";
  src: local("Arial"), local("ArialMT"), local("Liberation Sans"), local("Arimo");
  size-adjust: 94.74%;
  ascent-override: 101.86%;
  descent-override: 26.39%;
  line-gap-override: 0%;
}
```

Values come from `build-cabin-assets.py` (letter-frequency-weighted average
width against Liberation Sans, which is metric-compatible with Arial). Where
none of those local faces exist (most Android devices), the next fallback is
the platform UI font without adjustment.

**Why Cabin Figures exists.** Cabin has no tabular-figure (`tnum`) feature,
and its digits vary widely in width (its "1" is under half the width of its
"0"), so a column of amounts would not line up. Cabin Figures is an OFL
derivative of Cabin containing only the ten digits on one shared advance:
1–9 are Cabin's own glyphs, centered; the zero is Cabin's own zero taken from
a narrower point on Cabin's width axis, so its strokes are the designer's
rather than a squashed copy. Wherever `font-variant-numeric: tabular-nums` is
set, also use `--font-numeric` (each product's stylesheet does this once for
the `tabular-nums` class).

## Weights

| Weight | Role                                                                                         |
| ------ | -------------------------------------------------------------------------------------------- |
| 400    | Body, table cells, inputs, metadata                                                          |
| 500    | Labels, buttons, navigation, all heading roles, display numerals                            |
| 600    | Table headers, strong inline emphasis, eyebrow labels                                        |
| 700    | Only where a surface already uses bold; PDF headings                                         |

The variable file covers 400–700. Do not ask for 300, 800 or 900; they clamp.

## Scale

| Role                            | Size                                   | Line height | Weight | Letter spacing |
| ------------------------------- | -------------------------------------- | ----------- | ------ | -------------- |
| App page title                  | 1.5rem mobile / 2rem desktop (24/32px) | 1.2         | 500    | -0.01em        |
| Major section title             | 1.25rem (20px)                         | 1.3         | 500    | 0              |
| Compact card or utility heading | 1rem (16px)                            | 1.4         | 500    | 0              |
| Display numeral                 | 1.875rem (30px), tabular               | 1.2         | 500    | 0              |
| Interface and table text        | 0.875rem (14px)                        | 1.5         | 400    | 0              |
| Labels and buttons              | 0.875rem (14px)                        | 1.5         | 500    | 0              |
| Mobile editable fields          | 1rem (16px; prevents iOS zoom)         | 1.5         | 400    | 0              |
| Reading text / public-site body | 1rem (16px)                            | 1.6         | 400    | 0              |
| Secondary metadata              | 0.75rem (12px)                         | 1.5         | 400    | 0              |
| Uppercase eyebrow / overline    | 0.75rem (12px)                         | 1.4         | 600    | +0.06em        |

Letter spacing is 0 by default. Tighten only at 24px and above (-0.01em, at
most -0.015em); never tighten below 20px. Uppercase labels get +0.06em.
Marketing display sizes may go larger than this scale but use the same
weights and spacing rules.

Cabin is about 9% narrower than DM Sans at the same size and has a slightly
smaller line box, so it does not create new clipping where DM Sans fit.
Adjust spacing only where a screen shows clipping, wrapping or misalignment,
and record it.

## Generated documents

- **Printed HTML** (reports, receipts, rosters, printable exercises): use the
  same tokens; print stylesheets do not swap faces. A standalone print window
  or standalone HTML page declares its own Cabin `@font-face` and waits for
  `document.fonts.ready` before printing.
- **Generated PDFs** (Program Partner's jsPDF statements, letters, sheets
  and rosters; Woodshed's score, progress and results PDFs): embed
  `cabin-pdf-regular.ttf` / `cabin-pdf-bold.ttf` through each product's
  shared PDF helper; never set Helvetica directly. Codes stay Courier. The
  PDF fonts have Cabin's proportional digits, so right-align amounts in PDF
  tables.
- **pdf-lib signed records and text placed onto uploaded third-party PDFs**
  stay in Helvetica until a separately scoped export change has tested field
  geometry and signatures with Cabin. They are records, not reports.

## Rules for future work

1. Use the tokens or the shared components. Never write a font family name in
   a component, page or inline style; a test in each repository fails on new
   hard-coded families outside the allow-list above.
2. New headings use the heading role (`font-heading` in Program Partner);
   numbers in columns or a view's one large figure add `tabular-nums`.
3. Add a weight or style only when the role table needs it.
4. A new face needs an owner decision recorded here first.
