import fs from 'node:fs';
const keys=["fees","students","communication","forms","events","inventory","library","seating","teaching"];
export default keys.map(key=>JSON.parse(fs.readFileSync(new URL('../../content/features/'+key+'.json',import.meta.url),'utf8')));
