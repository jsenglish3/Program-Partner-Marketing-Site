// /changelog/version.txt: which set of What's new entries this build holds (scripts/whats-new.mjs, whatsNewVersion).
// The deploy workflow's check compares it with Program Partner's list and rebuilds the site only when they differ.
export const data = { permalink: '/changelog/version.txt', eleventyExcludeFromCollections: true };
export function render({ changelog }) {
  return `${changelog.version}\n`;
}
