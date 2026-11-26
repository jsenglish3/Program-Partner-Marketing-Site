// Data for every page in src/. lastmod is the date the sitemap gives each page (scripts/lastmod.mjs): when its own
// content last changed on main. A blog article sets its own, from HeyCatch (blog-post.njk).
import { lastCommitDate, later, sourceFiles } from '../scripts/lastmod.mjs';

export default {
  eleventyComputed: {
    lastmod: (data) => {
      if (!data.page || !data.page.inputPath || data.noindex) return undefined;
      let date = lastCommitDate(sourceFiles(data.page.inputPath, data));
      const name = data.page.inputPath.replace(/^.*\//, '');
      // The prices on these pages switch by themselves at each deadline (src/_data/pricing.js), with no commit.
      if (name === 'pricing.njk' || name === 'subscribe.njk') {
        if (data.pricing && !data.pricing.founding) date = later(date, data.pricing.foundingEnds);
        if (data.pricing && data.pricing.studio && !data.pricing.studio.founding) date = later(date, data.pricing.studio.foundingEnds);
      }
      // What's new changes whenever an entry goes live in Program Partner (scripts/whats-new.mjs).
      if (name === 'changelog.njk' && data.changelog && data.changelog.entries) {
        for (const e of data.changelog.entries) date = later(date, e.liveAt);
      }
      // The blog's index changes whenever an article is published or edited in HeyCatch.
      if (name === 'blog.njk' && data.blog && data.blog.articles) {
        for (const a of data.blog.articles) date = later(date, a.updated || a.published);
      }
      return date;
    },
  },
};
