import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
function element(id,dataset={},textContent=''){return {id,dataset,textContent,style:{},attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(k,f){this.events[k]=f},focus(){}}}
test('renamed pathway labels preserve every showcase and retain edited captions',()=>{
 const names=['Skill Pathways','Choir Karate','Scale Wars','Band Olympics','String Quest'];
 const chips=names.map((key,i)=>element('chip'+i,{name:key},'Custom label '+i));
 const tabs=['path','practice','class','concert'].map(key=>element('pw-tab-'+key,{tab:key}));
 const stage=element('stage');stage.clientWidth=1120;const canvas=element('canvas'),caption=element('caption',{},'Edited pathway caption'),panel=element('pw-panel'),replay=element('replay');
 const tabsRoot={querySelectorAll:()=>tabs};const pw={dataset:{captionPractice:'Edited practice caption',captionClass:'Edited seating for {name}',captionConcert:'Edited concert caption'},querySelectorAll:()=>chips,querySelector:selector=>({'[data-pw-stage]':stage,'[data-pw-canvas]':canvas,'[data-pw-caption]':caption,'#pw-panel':panel,'[data-pw-tabs]':tabsRoot,'[data-pw-replay]':replay,'#pw-tab-path':tabs[0]})[selector]};
 const document={querySelector:selector=>selector==='[data-pathways]'?pw:null,querySelectorAll:()=>[],addEventListener(){},getElementById:()=>panel};
 const sandbox={document,window:{matchMedia:()=>({matches:true})},ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},clearInterval(){},setInterval(){}};
 vm.runInNewContext(fs.readFileSync('src/assets/site.js','utf8'),sandbox);
 assert.equal(caption.textContent,'Edited pathway caption');
 chips.forEach((chip,i)=>{chip.events.click();assert.ok(canvas.innerHTML.includes('Custom label '+i));assert.equal(tabs[0].textContent,'Custom label '+i);assert.equal(caption.textContent,'Edited pathway caption')});
 tabs[1].events.click();assert.equal(caption.textContent,'Edited practice caption');
 tabs[2].events.click();assert.equal(caption.textContent,'Edited seating for Custom label 4');
 tabs[3].events.click();assert.equal(caption.textContent,'Edited concert caption');
});
