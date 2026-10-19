import json, re, sys, os
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
BASE="http://localhost:8787"
AXE=open('/home/claude/program-partner-marketing-site/node_modules/axe-core/axe.min.js').read()
pages=[l.strip().replace('https://myprogrampartner.com','') for l in re.findall(r'<loc>([^<]+)</loc>', open('/home/claude/program-partner-marketing-site/_site/sitemap.xml').read())]
pages.append('/404.html')
report={}
os.makedirs('/home/claude/qa-shots',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch()
    for path in pages:
        r={'axe':[], 'seo':[], 'links':[], 'errors':[], 'overflow':{}}
        pg=b.new_page(viewport={'width':1280,'height':900})
        pg.on('pageerror', lambda e: r['errors'].append(str(e)))
        pg.goto(BASE+path, wait_until='networkidle')
        # SEO
        seo=pg.evaluate('''() => ({
          title: document.title, desc: (document.querySelector('meta[name=description]')||{}).content||'',
          h1: document.querySelectorAll('h1').length, canonical:(document.querySelector('link[rel=canonical]')||{}).href||'',
          og: !!document.querySelector('meta[property="og:title"]'), lang: document.documentElement.lang,
          imgsNoAlt: [...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length,
          headings: [...document.querySelectorAll('h1,h2,h3,h4')].map(h=>h.tagName)
        })''')
        if len(seo['title'])>60: r['seo'].append(f"title {len(seo['title'])} chars")
        if not seo['desc']: r['seo'].append('no description')
        elif len(seo['desc'])>160: r['seo'].append(f"description {len(seo['desc'])} chars")
        if seo['h1']!=1: r['seo'].append(f"{seo['h1']} h1s")
        if seo['imgsNoAlt']: r['seo'].append(f"{seo['imgsNoAlt']} img without alt")
        # heading order skips
        last=1
        for h in seo['headings']:
            n=int(h[1])
            if n>last+1: r['seo'].append(f'heading skip {last}->{n}'); break
            last=n
        # axe
        pg.add_script_tag(content=AXE)
        res=pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa']});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,html:v.nodes[0].html.slice(0,120)}))}")
        r['axe']=res
        # links
        hrefs=pg.evaluate("()=>[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))")
        for h in set(hrefs):
            if h.startswith('/'):
                u=h.split('#')[0].split('?')[0]
                if not u: continue
                t=u if u.endswith('.html') or u.endswith('.xml') else u.rstrip('/')+'/index.html'
                if not os.path.exists('/home/claude/program-partner-marketing-site/_site'+t): r['links'].append(h)
        # responsive overflow
        for w in (360,768,1280):
            pg.set_viewport_size({'width':w,'height':900})
            ov=pg.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth")
            if ov>0: r['overflow'][w]=ov
            if path in ('/','/demo/','/features/fees/','/boosters/','/privacy/'):
                pg.screenshot(path=f"/home/claude/qa-shots/{path.strip('/').replace('/','-') or 'home'}-{w}.png", full_page=True)
        pg.close()
        report[path]=r
    b.close()
json.dump(report,open('/home/claude/qa-report.json','w'),indent=1)
for path,r in report.items():
    issues=[]
    if r['axe']: issues.append('axe: '+', '.join(f"{v['id']}({v['impact']},{v['n']})" for v in r['axe']))
    if r['seo']: issues.append('seo: '+', '.join(r['seo']))
    if r['links']: issues.append('broken: '+', '.join(r['links']))
    if r['errors']: issues.append('js: '+'; '.join(r['errors'])[:100])
    if r['overflow']: issues.append('overflow: '+str(r['overflow']))
    print(path, '| ' + (' | '.join(issues) if issues else 'clean'))
