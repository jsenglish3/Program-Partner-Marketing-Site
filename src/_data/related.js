// Related pages: the short block at the end of each page (base.njk) that links three to five pages on the same topic,
// so every page is reached from other pages' content and not only from the header, footer or home page. Picked by
// topic (features, who it's for, buying and switching, trust), never at random. A page missing from `links` shows no block.
//
// The same short names give each page's breadcrumb trail in its structured data (base.njk).
import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const nav = read('./nav.json');
// The one-line feature blurbs are the Every feature page's own (content editor: Every feature).
const product = read('../../content/copy/product.json').introduction;
const featureBlurb = {
  fees: product.text_005, forms: product.text_008, events: product.text_011, students: product.text_014,
  communication: product.text_016, inventory: product.text_019, library: product.text_022, seating: product.text_025,
  teaching: product.text_028,
};

const pages = {
  '/': { name: 'Home' },
  '/product/': { name: 'Every feature', blurb: 'Every part of Program Partner. Each program turns on what it needs and leaves the rest off.' },
  ...Object.fromEntries(nav.features.map((f) => [f.href, { name: f.name, blurb: featureBlurb[f.key] }])),
  '/directors/': { name: 'For directors', blurb: 'Fees, forms, instruments and reminders handled, so your time goes to rehearsal.' },
  '/boosters/': { name: 'For booster clubs', blurb: "Balances, payments, ledgers and budgets, so the treasurer's report is ready before the meeting." },
  '/schools/': { name: 'For schools and districts', blurb: 'How we protect student data, and what purchasing needs from us.' },
  '/theatre/': { name: 'For theatre programs', blurb: 'Audition sign-ups with videos, callbacks and casting, plus Thespian points families can see.' },
  '/studios/': { name: 'For private studios', blurb: 'Lesson schedules, notes, makeup credits, policies and payments for private teachers.' },
  '/families/': { name: 'For parents and students', blurb: "How parents and students sign in, and what they'll find there." },
  '/pricing/': { name: 'Pricing', blurb: 'One yearly price per school program with every feature, and a monthly or yearly plan for studios.' },
  '/subscribe/': { name: 'Subscribe', blurb: 'Subscribe online, or pay by purchase order or check.' },
  '/switching/': { name: 'How switching works', blurb: 'What changes when you move off spreadsheets, paper forms and group texts, and how the move works.' },
  '/security/': { name: 'Security and privacy', blurb: "What we store, who can see it, how it's protected, and what we will never do with it." },
  '/accessibility/': { name: 'Accessibility', blurb: 'How the site and the app work with a screen reader, keyboard, magnification or voice control.' },
  '/privacy/': { name: 'Privacy policy', blurb: 'What information Program Partner keeps, why, and who can see it.' },
  '/terms/': { name: 'Terms of service', blurb: 'The agreement for using the Program Partner app and website.' },
  '/contact/': { name: 'Contact', blurb: 'Questions, a quote or a form your district needs. We reply within one business day.' },
  '/changelog/': { name: "What's new", blurb: 'Dated changes to Program Partner, newest first.' },
  '/woodshed/': { name: 'Woodshed', blurb: 'Free practice for band, orchestra and choir students. No sign-in, no download.' },
  '/about/': { name: 'About', blurb: 'Built by a band director who runs his own program on it.' },
  '/demo/': { name: 'Schedule a demo', blurb: 'A walkthrough of the demo school, built around your own questions.' },
  '/blog/': { name: 'Blog' },
};

const related = {
  '/features/fees/': ['/features/events/', '/boosters/', '/pricing/', '/switching/'],
  '/features/students/': ['/families/', '/features/communication/', '/features/forms/', '/theatre/', '/switching/'],
  '/features/communication/': ['/features/students/', '/features/events/', '/families/', '/changelog/'],
  '/features/forms/': ['/features/events/', '/features/students/', '/schools/', '/pricing/'],
  '/features/events/': ['/features/fees/', '/features/forms/', '/boosters/', '/directors/'],
  '/features/inventory/': ['/features/library/', '/features/fees/', '/schools/', '/directors/'],
  '/features/library/': ['/features/teaching/', '/features/inventory/', '/woodshed/', '/directors/'],
  '/features/seating/': ['/features/teaching/', '/features/library/', '/directors/', '/pricing/'],
  '/features/teaching/': ['/features/seating/', '/woodshed/', '/theatre/', '/studios/', '/changelog/'],
  '/product/': ['/pricing/', '/switching/', '/changelog/', '/directors/', '/studios/'],
  '/directors/': ['/features/fees/', '/features/forms/', '/boosters/', '/switching/', '/pricing/'],
  '/boosters/': ['/features/fees/', '/directors/', '/security/', '/pricing/'],
  '/schools/': ['/security/', '/accessibility/', '/switching/', '/pricing/', '/contact/'],
  '/theatre/': ['/features/events/', '/features/forms/', '/features/teaching/', '/directors/', '/pricing/'],
  '/studios/': ['/features/teaching/', '/features/fees/', '/pricing/', '/contact/'],
  '/families/': ['/features/students/', '/woodshed/', '/accessibility/', '/contact/'],
  '/pricing/': ['/subscribe/', '/switching/', '/schools/', '/studios/', '/contact/'],
  '/subscribe/': ['/pricing/', '/schools/', '/switching/', '/contact/'],
  '/switching/': ['/pricing/', '/directors/', '/schools/', '/security/', '/contact/'],
  '/security/': ['/schools/', '/accessibility/', '/privacy/', '/changelog/', '/contact/'],
  '/accessibility/': ['/security/', '/families/', '/schools/', '/contact/'],
  '/privacy/': ['/security/', '/accessibility/', '/terms/', '/contact/'],
  '/terms/': ['/privacy/', '/security/', '/accessibility/', '/contact/'],
  '/about/': ['/directors/', '/studios/', '/changelog/', '/contact/'],
  '/contact/': ['/pricing/', '/schools/', '/families/', '/security/'],
  '/demo/': ['/pricing/', '/switching/', '/directors/', '/studios/'],
  '/woodshed/': ['/features/teaching/', '/families/', '/directors/', '/changelog/'],
  '/changelog/': ['/product/', '/security/', '/accessibility/', '/contact/'],
  '/blog/': ['/directors/', '/boosters/', '/schools/', '/studios/'],
};

for (const [page, list] of Object.entries(related)) for (const href of list) {
  if (!pages[href] || !pages[href].blurb) throw new Error(`related.js: ${page} links ${href}, which has no name and blurb`);
}

export default {
  heading: 'Related pages',
  pages,
  links: Object.fromEntries(Object.entries(related).map(([page, list]) => [page, list.map((href) => ({ href, ...pages[href] }))])),
};
