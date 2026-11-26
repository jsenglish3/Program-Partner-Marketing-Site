import fs from "node:fs";
import path from "node:path";
import { buildCms } from "./scripts/build-cms.mjs";
import { resolveMedia } from "./scripts/media.mjs";
import { srcsets, writeVariants, forget as forgetVariants } from "./scripts/responsive-images.mjs";
import { addImageSizes } from "./scripts/image-sizes.mjs";
import { writeHeaders } from "./scripts/headers.mjs";
import { writeRedirects } from "./scripts/redirects.mjs";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // The site is deployed only by .github/workflows/deploy.yml (README: "Hosting"). A Cloudflare dashboard Git
  // connection (Workers Builds, which sets WORKERS_CI) would race it for the custom domains, so its builds stop here.
  if (process.env.WORKERS_CI) {
    throw new Error("This site deploys from GitHub Actions (deploy.yml), not from a Cloudflare Git connection. Disconnect this repository in the Cloudflare dashboard.");
  }
  // The site is served from the root of myprogrampartner.com. PATH_PREFIX is only for building a copy that
  // lives under a subfolder (for example a GitHub preview address); production builds leave it unset.
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addGlobalData("pathPrefix", () => process.env.PATH_PREFIX || "/");
  // Where link previews (iMessage, Slack, Facebook) fetch the share image from. Defaults to site.url;
  // SHARE_ORIGIN overrides it only for a copy built for another address.
  eleventyConfig.addGlobalData("shareOrigin", () => process.env.SHARE_ORIGIN || "");
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/screenshots": "screenshots" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  eleventyConfig.addPassthroughCopy({ "src/admin/config.json": "admin/config.json", "src/admin/preview.js": "admin/preview.js" });
  eleventyConfig.addPassthroughCopy({ "src/uploads": "uploads" });
  eleventyConfig.addWatchTarget("content/");
  eleventyConfig.on("eleventy.before", () => forgetVariants());
  eleventyConfig.on("eleventy.after",({directories})=>buildCms(directories.output));
  // Phone-sized copies of the screenshots (scripts/responsive-images.mjs); the frame macro lists them in srcset.
  eleventyConfig.on("eleventy.after", ({ directories }) => writeVariants(directories.output));
  // Width and height on every image, from the file itself (scripts/image-sizes.mjs).
  eleventyConfig.addTransform("image-sizes", function (content) {
    return (this.page.outputPath || "").endsWith(".html") ? addImageSizes(content) : content;
  });
  // The security headers file for hosts that read one (scripts/headers.mjs), with the pages' inline script hashes.
  eleventyConfig.on("eleventy.after", ({ directories }) => writeHeaders(directories.output));
  // /whats-new/ forwards to /changelog/ (scripts/redirects.mjs).
  eleventyConfig.on("eleventy.after", ({ directories }) => writeRedirects(directories.output));
  // Screenshots live in src/screenshots/<slot>.png (or .jpg/.webp).
  // The frame partial shows the image when the file exists, otherwise a quiet placeholder.
  // <slot>-dark.webp is the same screen in dark mode (the home hero's Light/Dark switch shows it).
  // <slot>.mp4 (plus an optional <slot>.webm) is a short looping animation; <slot>.webp is its poster and fallback.
  // Videos are exposed as shots["<slot>@video"] so the frame macro can see them.
  const shotDir = path.join(process.cwd(), "src", "screenshots");
  eleventyConfig.addGlobalData("shots", async () => {
    const out = {};
    if (!fs.existsSync(shotDir)) return out;
    for (const f of fs.readdirSync(shotDir)) {
      const m = f.match(/^(.+)\.(png|jpe?g|webp)$/i);
      if (m) out[m[1]] = "/screenshots/" + f;
      const v = f.match(/^(.+)\.(mp4|webm)$/i);
      if (v) out[v[1] + (v[2].toLowerCase() === "mp4" ? "@video" : "@webm")] = "/screenshots/" + f;
    }
    const media=JSON.parse(fs.readFileSync(new URL('./content/media.json',import.meta.url),'utf8'));
    // "<image url>@srcset" entries: keyed by the image's own address, so they follow an editor's replacement upload.
    return { ...resolveMedia(out,media), ...(await srcsets()) };
  });

  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("hasFounderPhoto", () =>
    fs.existsSync(path.join(process.cwd(), "src", "assets", "trey-english.jpg"))
  );

  eleventyConfig.addFilter("split", (s, sep) => String(s).split(sep));
  eleventyConfig.addFilter("slug", (s) =>
    String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  );

  return {
    pathPrefix: process.env.PATH_PREFIX || "/",
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
