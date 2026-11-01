# Program Partner content editor

## Owner instructions

Editor, once released: https://myprogrampartner.com/admin/

This is content editing with a visual website preview. It is not a drag-and-drop page builder. Layout, typography, branding and application behavior remain in the existing templates and stylesheet.

1. Choose **Login with GitHub** using **jsenglish3**.
2. Open **Website content** and choose a page, feature, audience or shared section.
3. Expand the named section, edit the fields, and use the preview page selector and **Desktop / Phone** controls.
4. For images, choose/upload an image and enter meaningful alternative text. Screenshots also have an optional caption. Empty screenshot alt text retains the existing descriptive fallback.
5. **Save** creates or updates a draft on its own GitHub branch/pull request. It does not update the live site.
6. When ready, use the editorial workflow status controls and **Publish**. Decap merges the content draft into main. The existing GitHub Pages workflow builds and deploys it; wait for that workflow to finish, then check the public page.
7. Expired GitHub user tokens require signing in again. An unpublished draft can be discarded in the editor. A published change can be corrected in a new draft or reverted in GitHub.

For SEO changes, select the corresponding preview page and inspect its browser title/metadata in the resulting preview. The visible page heading is edited independently from SEO.

## Hosting and boundaries

Inspected baseline: jsenglish3/Program-Partner-Marketing-Site at 4d1d43b0bb95bf17d9a8c6945d51ae310088c8cd.
The marketing site uses Eleventy, Newsreader and DM Sans. It is hosted on **GitHub Pages**, deployed by .github/workflows/deploy.yml on pushes to main. It is not currently a Cloudflare Pages project. This implementation retains that deployment and adds only a separate Cloudflare OAuth Worker.

No Program Partner application, database, billing, customer data or application authentication changes are included. Existing marketing copy is carried over, including existing claims; this setup does not certify or revise those claims. Contact-form endpoint and submitted option values remain fixed.

## Dedicated GitHub App setup

Create a new, separate **Program Partner Marketing Editor** GitHub App in the jsenglish3 account. Do not reuse Woodshed credentials.

- Homepage: https://myprogrampartner.com
- OAuth callback: https://program-partner-editor.jsenglish3.workers.dev/api/callback
- Leave OAuth authorization during installation off; sign in from the editor after setup. Retain expiring user tokens.
- Webhook: inactive. No events, account or organization permissions.
- Repository permissions: **Contents read/write**, **Pull requests read/write**, **Commit statuses read**, **Metadata read** (automatic).
- Install using **Only select repositories**, selecting **Program-Partner-Marketing-Site only**.
- Do not select programhq-fmms or Woodshed.
- No GitHub App private key is required by this user-token flow.

App creation/installation grants security-sensitive repository write access. Complete the owner-controlled approval step in GitHub. If a browser automation approval is required, approve this exact app, repository and permission list.

Deploy oauth/worker.mjs with oauth/wrangler.jsonc into the existing Cloudflare account, using a distinct Worker named program-partner-editor. Store **GITHUB_CLIENT_ID**, **GITHUB_CLIENT_SECRET**, and **GITHUB_APP_ID** as encrypted Cloudflare Worker secrets. Set them through Cloudflare's secret controls; never paste them into chat, commit them, log them, or place them in a browser bundle. No secrets are populated by this PR.

The endpoint refuses sign-in until all bindings exist. It verifies signed ten-minute HttpOnly state, PKCE, exact editor origins, Trey’s GitHub login and numeric user ID, repository push permission, and that this App is installed on exactly the marketing repository. Successful OAuth messages use authorization:github:success: with an exact-origin/source handshake.

If the site later moves to Cloudflare Pages, reuse the structured content and preview, integrate the OAuth handler as Pages Functions (or retain the dedicated Worker), and configure that project's existing deployment. This PR does not migrate hosting or DNS.

## Files and checks

- content/copy/: page and shared-section copy.
- content/features/ and content/audiences/: per-page structured descriptions and FAQs.
- content/legal/: legal document content.
- content/media.json: screenshot image paths, alternative text and captions.
- content/seo.json: per-route SEO/social metadata.
- src/_data/site.json and nav.json: shared site settings/buttons and navigation.
- src/admin/config.json: readable editor fields, GitHub repository and editorial workflow.
- src/admin/preview.js: sandboxed live rendering using the same Nunjucks templates and CSS.
- scripts/build-cms.mjs: public preview data and Nunjucks browser bundle.
- oauth/: independent Cloudflare sign-in endpoint.
- tests/: OAuth rejection/protocol and live preview regression checks.

Run npm ci, npm run build, npm test. The implementation PR also compares all 29 original page outputs against the immutable baseline using scripts/check-preservation.mjs. Future editorial changes intentionally do not run this one-time preservation comparison.

Before calling the editor ready, verify in the actual browser: owner sign-in, denial of another account, heading/FAQ/image/SEO preview updates, draft branch/PR saving, live site unchanged while draft exists, Publish, successful GitHub Pages deployment, desktop/mobile appearance, and a harmless edit followed by restoration through the same draft/publish process.

## Verification status

The restored implementation builds successfully and all eleven automated tests pass. All 28 original HTML pages and the sitemap retain their original output (HTML comparison ignores whitespace between tags). In the isolated Decap test-backend browser session, editing the home heading updated the styled preview immediately and Save created a Draft separately from published content. That local test does not verify GitHub OAuth or remote publishing.

Actual dedicated GitHub App setup, encrypted secret installation, live sign-in, GitHub draft saving/publishing, production deployment round-trip and image upload remain unverified until setup and human merge. Desktop and 390px phone previews have been checked visually in the local browser. Production appearance must be checked after release.
