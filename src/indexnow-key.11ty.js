// The IndexNow key file at /<key>.txt (src/_data/indexnow.js).
export const data = {
  permalink: (data) => `/${data.indexnow.key}.txt`,
  eleventyExcludeFromCollections: true,
};

export function render({ indexnow }) {
  return indexnow.key;
}
