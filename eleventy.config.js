import fs from "node:fs";
import path from "node:path";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // The site is served from the root of myprogrampartner.com. PATH_PREFIX is only for building a copy that
  // lives under a subfolder (for example a GitHub preview address); production builds leave it unset.
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addGlobalData("pathPrefix", () => process.env.PATH_PREFIX || "/");
  // Where link previews (iMessage, Slack, Facebook) fetch the share image from. Defaults to site.url;
  // SHARE_ORIGIN overrides it only for a copy built for another address.
  eleventyConfig.addGlobalData("shareOrigin", () => process.env.SHARE_ORIGIN || "");
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/screenshots": "screenshots" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // Screenshots live in src/screenshots/<slot>.png (or .jpg/.webp).
  // The frame partial shows the image when the file exists, otherwise a quiet placeholder.
  // <slot>-dark.webp is the same screen in dark mode (the home hero's Light/Dark switch shows it).
  // <slot>.mp4 (plus an optional <slot>.webm) is a short looping animation; <slot>.webp is its poster and fallback.
  // Videos are exposed as shots["<slot>@video"] so the frame macro can see them.
  const shotDir = path.join(process.cwd(), "src", "screenshots");
  eleventyConfig.addGlobalData("shots", () => {
    const out = {};
    if (!fs.existsSync(shotDir)) return out;
    for (const f of fs.readdirSync(shotDir)) {
      const m = f.match(/^(.+)\.(png|jpe?g|webp)$/i);
      if (m) out[m[1]] = "/screenshots/" + f;
      const v = f.match(/^(.+)\.(mp4|webm)$/i);
      if (v) out[v[1] + (v[2].toLowerCase() === "mp4" ? "@video" : "@webm")] = "/screenshots/" + f;
    }
    return out;
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
