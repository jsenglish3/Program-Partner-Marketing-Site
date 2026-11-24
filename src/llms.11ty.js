// /llms.txt (https://llmstxt.org): a short, plain-text map of the site for AI assistants.
// Built from the same data as the pages (prices and their deadlines, page descriptions, What's new), so it changes
// with them on every build. Plain JavaScript rather than Nunjucks, so nothing in it is HTML-escaped.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const dateLabel = (date) => {
  const [y, m, d] = String(date || '').split('-');
  const month = MONTHS[Number(m) - 1];
  if (!month) return '';
  return d ? `${month} ${Number(d)}, ${y}` : `${month} ${y}`;
};

export const data = {
  permalink: '/llms.txt',
  eleventyExcludeFromCollections: true,
};

export function render({ site, seo, pricing, copy, audiences, features, changelog }) {
  const url = site.url;
  const pc = copy.pricing;
  const desc = (path) => (seo[path] && seo[path].description) || '';

  const school = pricing.founding
    ? `${pc.plan.amount_founding} a year per program for programs that subscribe by June 30, 2027, kept every year the subscription renews without a break; ${pc.plan.amount_standard} a year for programs that join on or after July 1, 2027.`
    : `${pc.plan.amount_standard} a year per program.`;
  const studio = pricing.studio.founding
    ? `${pc.studio.monthly_founding} a month or ${pc.studio.yearly_founding} a year for studios that subscribe by December 31, 2026, kept while the subscription renews; ${pc.studio.monthly_standard} a month or ${pc.studio.yearly_standard} a year from January 1, 2027.`
    : `${pc.studio.monthly_standard} a month or ${pc.studio.yearly_standard} a year.`;

  const lines = [
    '# Program Partner',
    '',
    `> Program Partner is the program office for band, orchestra, choir, theatre and private studios: fees and payments, students and families, forms and signatures, events and trips, inventory and uniforms, the music library, seating charts, and teaching tools such as Skill Pathways and practice logs. It was built by Trey English, a band director who runs his own program on it.`,
    '',
    'Key facts:',
    '',
    `- Price for school programs: ${school} Every feature is included. Billed yearly; schools can pay by purchase order or check.`,
    `- Price for private studios: ${studio} Every feature is included.`,
    `- Free trial: 30 days with no card, set up on request: ${url}/trial/`,
    "- No payment fees: families pay into the program's own Stripe, Square or PayPal account. Program Partner never holds a program's money and adds nothing on top; the processor's standard rates still apply.",
    '- Parent and student portals cost families nothing.',
    '- Woodshed, a free practice site for band, orchestra and choir students, comes with every plan, including Woodshed All-Access for directors.',
    '- Pricing is per program, not per director. A district can bring its programs on one at a time or together.',
    '- Student and family data is never sold or used for advertising, and Program Partner signs a data privacy agreement with a district on request.',
    `- Contact: ${site.supportEmail}. Demos: ${url}/demo/`,
    '',
    '## Main pages',
    '',
    `- [Every feature](${url}/product/): ${desc('/product/')}`,
    `- [Pricing](${url}/pricing/): ${desc('/pricing/')}`,
    `- [Free 30-day trial](${url}/trial/): ${desc('/trial/')}`,
    `- [Security and privacy](${url}/security/): ${desc('/security/')}`,
    `- [Switching to Program Partner](${url}/switching/): ${desc('/switching/')}`,
    `- [What's new](${url}/changelog/): ${desc('/changelog/')}`,
    `- [About](${url}/about/): ${desc('/about/')}`,
    `- [Schedule a demo](${url}/demo/): ${desc('/demo/')}`,
    '',
    "## Who it's for",
    '',
    ...audiences.map((a) => `- [${a.title || a.h1}](${url}/${a.key}/): ${a.sub}`),
    `- [Families](${url}/families/): ${desc('/families/')}`,
    `- [Woodshed](${url}/woodshed/): ${desc('/woodshed/')}`,
    '',
    '## Features',
    '',
    ...features.map((f) => `- [${f.name}](${url}/features/${f.key}/): ${f.sub}`),
    '',
    '## Recent changes',
    '',
    ...(changelog.entries || []).slice(0, 6).map((e) => `- ${dateLabel(e.date)}: [${e.title}](${url}/changelog/#${slug(e.date + '-' + e.title)}). ${e.body}`),
    '',
  ];
  return lines.join('\n');
}
