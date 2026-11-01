import fs from 'node:fs';
export default JSON.parse(fs.readFileSync(new URL('../../content/switching.json',import.meta.url),'utf8'));
