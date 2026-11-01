import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import nunjucks from 'nunjucks';
const config=JSON.parse(fs.readFileSync('src/admin/config.json')),bundle=JSON.parse(fs.readFileSync('_site/admin/preview-data.json'));
const source=fs.readFileSync('src/admin/preview.js','utf8');
async function preview(overrides={}){const window={h:()=>null,createClass:spec=>spec};const sandbox={window,nunjucks,structuredClone,location:{origin:'https://myprogrampartner.com'},fetch:async url=>({json:async()=>url.includes('config.json')?config:bundle}),CMS:{registerPreviewTemplate(){},init(){}},document:{getElementById(){return {append(){}}}}};Object.assign(sandbox,overrides);await vm.runInNewContext(source,sandbox);assert.ok(window.ProgramPartnerPreview,'preview must initialize');return window.ProgramPartnerPreview;}
test('all configured content entries render the production templates',async()=>{const p=await preview();for(const f of config.collections[0].files){const data=JSON.parse(fs.readFileSync(f.file));const html=p.render(f.name,data,x=>x);assert.match(html,/<!doctype html>/i,f.name);assert.ok(!html.includes('undefined'),f.name);assert.match(html,/assets\/site.css/,f.name)}});
test('draft heading updates immediately without changing source',async()=>{
 const p=await preview(),original=fs.readFileSync('content/copy/index.json','utf8'),data=JSON.parse(original);
 data.hero_h.text_005='Reversible preview check';
 assert.match(p.render('copy_index',data,x=>x),/Reversible preview check/);
 assert.equal(fs.readFileSync('content/copy/index.json','utf8'),original);
});
test('feature FAQ, uploaded image, alt text, caption and SEO update in preview',async()=>{const p=await preview(),feature=structuredClone(bundle.data.features[0]);feature.faq[0].a='Preview-only FAQ answer';assert.match(p.render('features_'+feature.key,feature,x=>x),/Preview-only FAQ answer/);const media=structuredClone(bundle.data.media);media['home-hero-all-browser']={image:'/uploads/preview.png',alt:'Preview image alternative',caption:'Preview image caption'};let html=p.render('media',media,x=>x);assert.match(html,/\/uploads\/preview.png/);assert.match(html,/Preview image alternative/);assert.match(html,/Preview image caption/);const seo=structuredClone(bundle.data.seo);seo['/'].description='Preview SEO description';assert.match(p.render('seo',seo,x=>x),/content="Preview SEO description"/)});
test('preview cannot submit forms or reach editor storage',async()=>{const p=await preview(),html=p.render('copy_index',bundle.data.copy.index,x=>x);assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);assert.ok(source.includes("sandbox:'allow-scripts'"));assert.ok(!source.includes('allow-same-origin'));assert.ok(!html.includes('static.cloudflareinsights.com'))});
test('editable data has no code or form endpoint fields in visible widgets',()=>{assert.equal(config.publish_mode,'editorial_workflow');assert.equal(config.backend.repo,'jsenglish3/Program-Partner-Marketing-Site');assert.equal(config.backend.branch,'main');const site=config.collections[0].files.find(f=>f.name==='site');assert.equal(site.fields.find(f=>f.name==='chatEndpoint').widget,'hidden');for(const f of config.collections[0].files)assert.match(f.file,/\.json$/)});

test('admin stays out of the public sitemap and delivers no front matter',()=>{const html=fs.readFileSync('_site/admin/index.html','utf8');assert.ok(html.startsWith('<!doctype html>'));assert.match(html,/name="robots" content="noindex,nofollow"/);assert.ok(!fs.readFileSync('_site/sitemap.xml','utf8').includes('/admin/'))});

test('quotes and markup in edited image text remain valid escaped attributes',async()=>{
 const p=await preview(),media=structuredClone(bundle.data.media),text='The "Fees" screen <sample>';
 media['home-hero-all-browser'].alt=text;
 media['fees-walkthrough'].alt=text;
 let html=p.render('media',media,x=>x);
 assert.ok(html.includes('alt="The &quot;Fees&quot; screen &lt;sample&gt;"'));
 html=p.render('media',media,x=>x,'features/fees');
 assert.ok(html.includes('aria-label="The &quot;Fees&quot; screen &lt;sample&gt; (short animation)"'));
 const seo=structuredClone(bundle.data.seo);seo['/'].imageAlt=text;seo['/'].title=text;seo['/'].description=text;
 html=p.render('seo',seo,x=>x);assert.ok(html.includes('content="The &quot;Fees&quot; screen &lt;sample&gt;"'));
});

test('replacement uploads and still-image selection supersede animations in preview',async()=>{
 const p=await preview(),media=structuredClone(bundle.data.media);
 let context=p.context('media',media,'features/fees');assert.ok(context.d.shots['fees-walkthrough@video']);
 media['fees-walkthrough'].image='/uploads/replacement.png';
 context=p.context('media',media,'features/fees');assert.equal(context.d.shots['fees-walkthrough@video'],undefined);assert.equal(context.d.shots['fees-walkthrough@webm'],undefined);
 let html=p.render('media',media,x=>x,'features/fees');assert.ok(html.includes('src="/uploads/replacement.png"'));assert.ok(!html.includes('<video'));
 media['fees-walkthrough'].image=bundle.data.originalShots['fees-walkthrough'];media['fees-walkthrough'].preferImage=true;
 assert.ok(!p.render('media',media,x=>x,'features/fees').includes('<video'));
 media['fees-walkthrough'].preferImage=false;assert.ok(p.render('media',media,x=>x,'features/fees').includes('<video'));
});

test('SEO images accept both uploaded paths and external HTTPS URLs',async()=>{const p=await preview(),seo=structuredClone(bundle.data.seo);seo['/'].image='https://example.com/social.png';let html=p.render('seo',seo,x=>x);assert.ok(html.includes('content="https://example.com/social.png"'));assert.ok(!html.includes('https://myprogrampartner.comhttps://'));seo['/'].image='/uploads/social.png';html=p.render('seo',seo,x=>x);assert.ok(html.includes('content="https://myprogrampartner.com/uploads/social.png"'))});

test('editable showcase labels keep stable keys and scripts remain outside content fields',async()=>{
 const p=await preview(),copy=structuredClone(bundle.data.copy.pathways);copy.pathways.text_006='Renamed choir activity';const html=p.render('copy_pathways',copy,x=>x);
 assert.ok(html.includes('data-name="Choir Karate">Renamed choir activity</button>'));
 const demo=config.collections[0].files.find(f=>f.name==='copy_demo');assert.ok(!demo.fields.some(section=>section.fields.some(f=>f.name==='text_032')));
 assert.ok(fs.readFileSync('src/demo.njk','utf8').includes('src="https://challenges.cloudflare.com/turnstile/v0/api.js"'));
});


test('uploaded blob images become data URLs inside the isolated preview',async()=>{
 const blobUrl='blob:https://myprogrampartner.com/test-upload',dataUrl='data:image/png;base64,dGVzdA==';let reads=0;
 const p=await preview({fetch:async url=>url.startsWith('blob:')?{ok:true,blob:async()=>{reads++;return {};}}:{json:async()=>url.includes('config.json')?config:bundle},FileReader:class{readAsDataURL(){this.result=dataUrl;this.onload();}}});
 const media=structuredClone(bundle.data.media);media['home-hero-all-browser']={image:'/uploads/test.png',alt:'Upload test',caption:'Upload caption'};
 const getAsset=path=>path==='/uploads/test.png'?blobUrl:path;
 assert.equal(await p.prepareAssets(media,getAsset),true);
 const html=p.render('media',media,getAsset);
 assert.ok(html.includes('src="'+dataUrl+'"'));assert.ok(!html.includes(blobUrl));
 assert.equal(await p.prepareAssets(media,getAsset),false);assert.equal(reads,1);
 assert.ok(source.includes("sandbox:'allow-scripts'"));assert.ok(!source.includes('allow-same-origin'));
});
