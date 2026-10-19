import fs from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/screenshots": "screenshots" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // Screenshots live in src/screenshots/<slot>.png (or .jpg/.webp).
  // The frame partial shows the image when the file exists, otherwise a quiet placeholder.
  const shotDir = path.join(process.cwd(), "src", "screenshots");
  eleventyConfig.addGlobalData("shots", () => {
    const out = {};
    if (!fs.existsSync(shotDir)) return out;
    for (const f of fs.readdirSync(shotDir)) {
      const m = f.match(/^(.+)\.(png|jpe?g|webp)$/i);
      if (m) out[m[1]] = "/screenshots/" + f;
    }
    return out;
  });

  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("hasFounderPhoto", () =>
    fs.existsSync(path.join(process.cwd(), "src", "assets", "trey-english.png"))
  );

  eleventyConfig.addFilter("split", (s, sep) => String(s).split(sep));
  eleventyConfig.addFilter("slug", (s) =>
    String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
