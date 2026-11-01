import fs from 'node:fs';
export default JSON.parse(fs.readFileSync(new URL('../../content/seo.json',import.meta.url),'utf8'));
