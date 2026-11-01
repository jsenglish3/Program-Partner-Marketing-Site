// One-time migration check, intentionally only run for the editor implementation PR.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const root=process.cwd(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'pp-copy-baseline-'));
try{
 const archive=execFileSync('git',['archive','4d1d43b0bb95bf17d9a8c6945d51ae310088c8cd'],{maxBuffer:50*1024*1024});
 execFileSync('tar',['-x','-C',dir],{input:archive});
 fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
 execFileSync(process.execPath,[path.join(root,'node_modules/@11ty/eleventy/cmd.cjs')],{cwd:dir,stdio:'pipe'});
 const html=[];function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(p.endsWith('.html'))html.push(path.relative(path.join(dir,'_site'),p));}}walk(path.join(dir,'_site'));
 const normalize=s=>s.replace(/>\s+</g,'><').trim();
 for(const p of html)assert.equal(normalize(fs.readFileSync(path.join(root,'_site',p),'utf8')),normalize(fs.readFileSync(path.join(dir,'_site',p),'utf8')),'Existing published HTML changed: '+p);
 console.log('Preserved the existing HTML, copy and layout of '+html.length+' pages.');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
