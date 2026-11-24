// What's new (/changelog/): dated entries, newest first, edited in content/changelog.json (content editor: What's new).
// changelog.njk turns each date into words and an anchor, so the editor's preview shows the same thing.
import fs from 'node:fs';
export default JSON.parse(fs.readFileSync(new URL('../../content/changelog.json', import.meta.url), 'utf8'));
