// What's new (/changelog/): the heading and introduction from content/changelog.json (content editor: What's new),
// and the entries from Program Partner's What's new list, read when the site is built (scripts/whats-new.mjs,
// changelogPage; README: "Proof, profiles and what's new"). { heading, intro, entries, woodshed, version, source }.
import { changelogPage } from '../../scripts/whats-new.mjs';

export default () => changelogPage();
