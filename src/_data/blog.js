// The blog's articles, read from HeyCatch when the site is built (scripts/blog.mjs; README: "Blog").
// { articles, version, source }. With no HEYCATCH_API_KEY, or when HeyCatch can't be read and no copy is kept,
// articles is empty: /blog/ says so and the Blog links stay hidden.
import fs from 'node:fs';
import { loadBlog } from '../../scripts/blog.mjs';

const site = JSON.parse(fs.readFileSync(new URL('./site.json', import.meta.url), 'utf8'));

export default () => loadBlog({ siteUrl: site.url });
