import fs from 'node:fs';
const keys=["privacy","terms","accessibility"];
export default Object.fromEntries(keys.map(key=>[key,JSON.parse(fs.readFileSync(new URL('../../content/legal/'+key+'.json',import.meta.url),'utf8'))]));
