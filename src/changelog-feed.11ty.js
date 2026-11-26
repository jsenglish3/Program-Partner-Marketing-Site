// /changelog/feed.xml: the What's new entries as RSS (scripts/whats-new.mjs), for anyone who follows the page.
import { rssFeed } from '../scripts/whats-new.mjs';

export const data = { permalink: '/changelog/feed.xml', eleventyExcludeFromCollections: true };
export function render({ site, changelog }) {
  return rssFeed({ siteUrl: site.url, title: changelog.heading, description: changelog.intro, entries: changelog.entries });
}
