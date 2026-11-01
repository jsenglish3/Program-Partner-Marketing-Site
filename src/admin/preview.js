/* Preview uses the production templates, stylesheet, fonts and public script. */
(async()=>{
 const [config,bundle]=await Promise.all([fetch('/admin/config.json').then(r=>r.json()),fetch('/admin/preview-data.json').then(r=>r.json())]);
 const loader=new nunjucks.Loader();
 loader.getSource=name=>({src:bundle.templates[name],path:name,noCache:true});
 const env=new nunjucks.Environment(loader,{autoescape:false});
 env.addFilter('split',(s,sep)=>String(s).split(sep));
 env.addFilter('slug',s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''));
 env.addFilter('url',s=>s);
 const h=window.h;
 function context(file,value,selected){
  const d=structuredClone(bundle.data);let template='index.njk',pageUrl='/';
  if(file.startsWith('copy_')){const key=file.slice(5);d.copy[key]=value;if(bundle.pages[key+'.njk'])template=key+'.njk';if(key==='pathways')template='index.njk';}
  else if(file.startsWith('features_')){d.f=value;template='feature.njk';d.features=d.features.map(f=>f.key===value.key?value:f);}
  else if(file.startsWith('audiences_')){d.a=value;template='audience.njk';d.audiences=d.audiences.map(a=>a.key===value.key?value:a);}
  else if(file.startsWith('legal_')){d.k=file.slice(6);d.legal[d.k]=value;template='legal.njk';}
  else if(file==='switching'){d.switching=value;template='switching.njk';}
  else if(['seo','site','nav','media'].includes(file))d[file]=value;
  if(selected){
   if(selected.startsWith('features/')){template='feature.njk';d.f=d.features.find(f=>f.key===selected.slice(9));}
   else if(selected.startsWith('audiences/')){template='audience.njk';d.a=d.audiences.find(a=>a.key===selected.slice(10));}
   else if(selected.startsWith('legal/')){template='legal.njk';d.k=selected.slice(6);}
   else template=selected+'.njk';
  }
  const meta=bundle.pages[template];
  if(typeof meta.permalink==='string'&&!meta.permalink.includes('{{'))pageUrl=meta.permalink;
  if(template==='feature.njk'){d.f??=d.features[0];pageUrl='/features/'+d.f.key+'/';d.title=d.f.name;d.description=d.f.sub;d.current=d.f.key;}
  else if(template==='audience.njk'){d.a??=d.audiences[0];pageUrl='/'+d.a.key+'/';d.title=d.a.title||d.a.h1;d.description=d.a.sub;d.current=d.a.key;}
  else if(template==='legal.njk'){d.k??='privacy';pageUrl='/'+d.k+'/';d.title=d.legal[d.k].h1;d.description=d.legal[d.k].desc||d.legal[d.k].title+' for the Program Partner app and website.';d.current='legal';}
  else Object.assign(d,{title:meta.title,description:meta.description,current:meta.current,noindex:meta.noindex});
  d.page={url:pageUrl};d.site.chatEndpoint='';d.site.cloudflareAnalyticsToken='';d.site.turnstileSiteKey='';
  d.shots={...d.originalShots};
  for(const [slot,m] of Object.entries(d.media)){
   if(m.preferImage||(m.image&&m.image!==d.originalShots[slot])){delete d.shots[slot+'@video'];delete d.shots[slot+'@webm'];}
   if(m.image)d.shots[slot]=m.image;d.shots[slot+'@alt']=m.alt;d.shots[slot+'@caption']=m.caption;
  }
  return {d,template};
 }
 function render(file,value,getAsset,selected){
  const {d,template}=context(file,value,selected);
  function assets(obj){if(!obj||typeof obj!=='object')return;for(const [k,v]of Object.entries(obj)){if(typeof v==='string'&&/^(\/uploads\/|\/screenshots\/|\/assets\/)/.test(v)){const asset=getAsset(v);obj[k]=asset?String(asset):v;}else if(v&&typeof v==='object')assets(v);}}assets(d);
  d.content=env.render(template,d);let html=env.render('layouts/base.njk',d);
  const origin=location.origin;
  const protection='<base href="'+origin+'/"><meta http-equiv="Content-Security-Policy" content="default-src '+origin+' blob: data:; script-src '+origin+' \'unsafe-inline\'; style-src '+origin+' \'unsafe-inline\'; img-src '+origin+' blob: data: https:; font-src '+origin+'; connect-src \'none\'; form-action \'none\'"><script>addEventListener("submit",e=>{e.preventDefault();e.stopImmediatePropagation()},true);addEventListener("click",e=>{if(e.target.closest("a"))e.preventDefault()},true)<\/script>';
  return html.replace('<head>','<head>'+protection);
 }
 const options=Object.keys(bundle.pages).filter(k=>!['feature.njk','audience.njk','legal.njk'].includes(k)).map(k=>({value:k.slice(0,-4),label:k==='index.njk'?'Home':k.slice(0,-4)}))
  .concat(bundle.data.features.map(f=>({value:'features/'+f.key,label:'Feature: '+f.name})),bundle.data.audiences.map(a=>({value:'audiences/'+a.key,label:a.title})),bundle.data.legalKeys.map(k=>({value:'legal/'+k,label:k})));
 const Preview=window.createClass({
  getInitialState(){return {page:'',phone:false,available:600};},
  componentDidMount(){
   this.resizeObserver=new ResizeObserver(entries=>{const available=Math.round(entries[0].contentRect.width);if(available>0&&available!==this.state.available)this.setState({available});});
   if(this.previewContainer)this.resizeObserver.observe(this.previewContainer);
  },
  componentWillUnmount(){this.resizeObserver?.disconnect();},
  render(){
   const props=this.props;const slug=props.entry.get('slug');
   const file=config.collections[0].files.find(f=>f.name===slug||f.file===props.entry.get('path'))?.name||slug;
   try{
    const controls=h('div',{style:{padding:'10px',display:'flex',gap:'8px',flexWrap:'wrap',background:'#f8f5ef'}},
     h('label',{},'Preview page ',h('select',{value:this.state.page,onChange:e=>this.setState({page:e.target.value})},h('option',{value:''},'Current content'),...options.map(o=>h('option',{key:o.value,value:o.value},o.label)))),
     h('button',{type:'button',onClick:()=>this.setState({phone:false}),'aria-pressed':!this.state.phone},'Desktop'),
     h('button',{type:'button',onClick:()=>this.setState({phone:true}),'aria-pressed':this.state.phone},'Phone'));
    const width=this.state.phone?390:1280;
    const scale=Math.min(1,this.state.available/width);
    const preview=h('iframe',{title:'Live website content preview',sandbox:'allow-scripts',style:{display:'block',width:width+'px',height:Math.round(1000/scale)+'px',border:0,transform:'scale('+scale+')',transformOrigin:'top left'},srcDoc:render(file,props.entry.get('data').toJS(),props.getAsset,this.state.page)});
    const meta=context(file,props.entry.get('data').toJS(),this.state.page).d;
    const seo=meta.seo[meta.page.url]||{};
    const seoSummary=h('details',{style:{padding:'8px 12px',background:'#f8f5ef',font:'13px system-ui'}},h('summary',{},'SEO preview'),h('strong',{},seo.title||meta.title||'Program Partner'),h('p',{},seo.description||meta.description||meta.site.description));
    return h('div',{},controls,seoSummary,h('div',{ref:el=>{this.previewContainer=el;},style:{width:'100%',height:'1000px',overflow:'hidden'}},preview));
   }catch(e){return h('p',{},'Preview unavailable: '+e.message);}
  }
 });
 CMS.registerPreviewTemplate('website',Preview);
 for(const file of config.collections[0].files)CMS.registerPreviewTemplate(file.name,Preview);
 window.ProgramPartnerPreview={render,context};
 CMS.init({config,load_config_file:false});
})().catch(()=>{document.getElementById('editor-note').append(' The editor could not load. Refresh to try again.');});
