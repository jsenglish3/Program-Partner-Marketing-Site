// IndexNow (https://www.indexnow.org): after each deploy, the pages whose sitemap lastmod is new or changed are
// sent to the search engines that take IndexNow (Bing, Yandex, Naver, Seznam and others; Google doesn't use it).
// The key is public by design: it is served at /<key>.txt (src/indexnow-key.11ty.js) to prove the site sent the
// list. scripts/indexnow.mjs works out the list and sends it; .github/workflows/deploy.yml runs it.
export default {
  key: 'cc08fb3804d10366e745d3b23ec6d82f',
  host: 'myprogrampartner.com',
};
