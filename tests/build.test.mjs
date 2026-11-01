import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import {buildCms} from '../scripts/build-cms.mjs';
test('Eleventy alone generates editor dependencies and subsequent builds read fresh data',async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'pp-editor-build-')),fixture='src/_data/cmsLifecycleCheck.json';
 assert.ok(!fs.existsSync(fixture));
 try{
  fs.writeFileSync(fixture,JSON.stringify({label:'First value'}));
  execFileSync(process.execPath,['node_modules/@11ty/eleventy/cmd.cjs','--output='+output],{stdio:'pipe'});
  const bundle=()=>JSON.parse(fs.readFileSync(path.join(output,'admin/preview-data.json')));
  assert.equal(bundle().data.cmsLifecycleCheck.label,'First value');assert.ok(fs.statSync(path.join(output,'admin/nunjucks.min.js')).size>1000);
  fs.writeFileSync(fixture,JSON.stringify({label:'Updated value'}));await buildCms(output);assert.equal(bundle().data.cmsLifecycleCheck.label,'Updated value');
 }finally{fs.rmSync(fixture,{force:true});fs.rmSync(output,{recursive:true,force:true})}
});
