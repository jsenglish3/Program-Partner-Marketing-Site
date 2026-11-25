// www.myprogrampartner.com sends every visit to the same address on myprogrampartner.com, permanently, as GitHub
// Pages did. Its own tiny Worker (www/wrangler.jsonc) because the site's Worker serves files only. README: "Hosting".
export default {
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.hostname = 'myprogrampartner.com';
    url.port = '';
    return new Response(null, {
      status: 301,
      headers: { Location: url.toString(), 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' },
    });
  },
};
