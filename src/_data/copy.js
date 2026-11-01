import fs from 'node:fs';
const dir=new URL('../../content/copy/',import.meta.url);
export default Object.fromEntries(fs.readdirSync(dir).filter(p=>p.endsWith('.json')).map(p=>[p.slice(0,-5),JSON.parse(fs.readFileSync(new URL(p,dir),'utf8'))]));
