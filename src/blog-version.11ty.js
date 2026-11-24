// /blog/version.txt: which set of HeyCatch articles this build holds (scripts/blog.mjs, blogVersion). The deploy
// workflow's blog check compares it with HeyCatch and rebuilds the site only when they differ.
export const data = { permalink: '/blog/version.txt', eleventyExcludeFromCollections: true };
export function render({ blog }) {
  return `${blog.version}\n`;
}
