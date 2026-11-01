import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { resolveMedia } from './media.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,d)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof d==='string'?d:JSON.stringify(d,null,2)+'\n')};
const templates={},pages={};
for(const p of fs.readdirSync('src').filter(p=>p.endsWith('.njk')&&p!=='sitemap.njk')){
 const f=matter(fs.readFileSync('src/'+p,'utf8'));templates[p]=f.content;pages[p]=f.data;
}
for(const p of ['macros.njk','layouts/base.njk','partials/header.njk','partials/footer.njk','partials/pathways.njk'])templates[p]=fs.readFileSync('src/_includes/'+p,'utf8');
const data={};for(const p of fs.readdirSync('src/_data')){const key=p.replace(/\.(js|json)$/,'');if(p.endsWith('.json'))data[key]=read('src/_data/'+p);else if(p.endsWith('.js'))data[key]=(await import(path.resolve('src/_data/'+p))).default;}
data.buildYear=new Date().getFullYear();data.hasFounderPhoto=fs.existsSync('src/assets/trey-english.jpg');data.shareOrigin='';data.pathPrefix='/';data.shots={};
for(const p of fs.readdirSync('src/screenshots')){const m=p.match(/^(.+)\.(png|jpe?g|webp)$/);if(m)data.shots[m[1]]='/screenshots/'+p;const v=p.match(/^(.+)\.(mp4|webm)$/);if(v)data.shots[v[1]+(v[2]==='mp4'?'@video':'@webm')]='/screenshots/'+p;}
data.originalShots={...data.shots};
data.shots=resolveMedia(data.originalShots,data.media);
write('_site/admin/preview-data.json',{templates,pages,data});
write('_site/admin/nunjucks.min.js',fs.readFileSync('node_modules/nunjucks/browser/nunjucks.min.js','utf8'));
