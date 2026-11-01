import fs from 'node:fs';
const keys=["directors","boosters","schools","studios"];
export default keys.map(key=>JSON.parse(fs.readFileSync(new URL('../../content/audiences/'+key+'.json',import.meta.url),'utf8')));
