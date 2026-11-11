// Program Partner's yearly price, decided by the owner on 7 November 2026:
// $299 a year (the founding price) for programs that subscribe by 30 June 2027,
// kept every year they renew, then $349 a year for programs that join from
// 1 July 2027. The founding price shows until the start of 1 July 2027 in
// Eastern time. The site only changes when it is rebuilt, so the deploy
// workflow runs on its own at 04:05 UTC on 1 July (00:05 Eastern).
//
// Private studios get their own plan (owner decision, 11 November 2026),
// monthly or yearly: $19 a month or $190 a year at the founding price, same
// deadline and same keep-it-while-you-renew rule, then $24 a month or $240 a
// year. Schools stay yearly only. The app's copy of these prices is
// src/lib/billing-pricing.ts in jsenglish3/programhq-fmms; change both together.
//
// The words live in content/copy/pricing.json and content/copy/subscribe.json.
// This file holds what the content editor must not change: the switch-over
// moment and the Stripe checkout links.
//
// PRICING_NOW (an ISO date) lets a build pretend it is another moment; the
// tests use it to build both sides of the deadline.

const FOUNDING_ENDS = '2027-07-01T04:00:00Z';

const now = process.env.PRICING_NOW ? Date.parse(process.env.PRICING_NOW) : Date.now();
if (Number.isNaN(now)) throw new Error('PRICING_NOW is not a date: ' + process.env.PRICING_NOW);

export default {
  foundingEnds: FOUNDING_ENDS,
  founding: now < Date.parse(FOUNDING_ENDS),
  // Stripe Payment Links on the Program Partner, LLC account. An empty link
  // sends Subscribe to the Let's chat form with Pricing checked instead.
  checkout: {
    founding: 'https://buy.stripe.com/3cI9AS74J3FS2bh1Dw2sM02',
    standard: '',
  },
  // Structured data for the pricing page.
  amount: { founding: '299.00', standard: '349.00' },
  foundingLastDay: '2027-06-30',
  // The studio plan's Payment Links, monthly and yearly. The $24 / $240 links
  // aren't set yet; an empty one falls back to the Let's chat form.
  studio: {
    checkout: {
      founding: {
        monthly: 'https://buy.stripe.com/6oUaEWbkZ3FSg27aa22sM03',
        yearly: 'https://buy.stripe.com/3cI9AS2Ot2BO9DJ6XQ2sM04',
      },
      standard: { monthly: '', yearly: '' },
    },
    amount: {
      founding: { monthly: '19.00', yearly: '190.00' },
      standard: { monthly: '24.00', yearly: '240.00' },
    },
  },
};
