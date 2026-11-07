// Package a review copy without changing production hosting or live content.
import fs from 'node:fs';
import path from 'node:path';
const source='_site', output='_staging';
fs.rmSync(output,{recursive:true,force:true});
fs.cpSync(source,output,{recursive:true});
fs.rmSync(path.join(output,'admin'),{recursive:true,force:true});
fs.rmSync(path.join(output,'CNAME'),{force:true});
function prepare(directory){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory()){prepare(file);continue;}
  if(!entry.name.endsWith('.html'))continue;
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<head>/i,'<head>\n<meta name="robots" content="noindex,nofollow">');
  html=html.replaceAll('https://app.myprogrampartner.com','https://program-partner-staging.jsenglish3.workers.dev');
  html=html.replace(/data-endpoint="[^"]*"/g,'data-endpoint=""');
  // Subscribe buttons go to live Stripe checkout; a review copy must never take a real payment.
  html=html.replace(/href="https:\/\/buy\.stripe\.com\/[^"]*"/g,'href="/subscribe/#staging-checkout-off"');
  html=html.replace(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com[^>]*><\/script>/g,'');
  fs.writeFileSync(file,html);
 }
}
prepare(output);
fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
fs.appendFileSync(path.join(output,'_headers'),'\n/*\n  X-Robots-Tag: noindex, nofollow\n');
console.log('Prepared _staging: no indexing, no editor, no live form endpoint or checkout; app links use staging.');
