// Dedicated Program Partner marketing editor; no application or customer-data access.
const PRIMARY='https://program-partner-editor.jsenglish3.workers.dev';
const ORIGINS=new Set(['https://myprogrampartner.com','https://www.myprogrampartner.com']);
const COOKIE='__Host-pp-marketing-oauth';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const encoder=new TextEncoder();
function base64url(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(value){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));}
async function key(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function sign(payload,secret){const data=base64url(encoder.encode(JSON.stringify(payload)));return data+'.'+base64url(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(data)));}
async function verify(cookie,secret){try{const [data,sig,...extra]=cookie.split('.');if(!sig||extra.length)return null;if(!await crypto.subtle.verify('HMAC',await key(secret),decode(sig),encoder.encode(data)))return null;return JSON.parse(new TextDecoder().decode(decode(data)));}catch{return null;}}
const expired=COOKIE+'=; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';
function fail(message,status=400){return new Response(message,{status,headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Set-Cookie':expired}});}
function cookie(request){return request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!['/api/auth','/api/callback'].includes(url.pathname))return fail('Not found',404);
 if(request.method!=='GET')return fail('Method not allowed',405);
 if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET||!env.GITHUB_APP_ID)return fail('Editor sign-in is not configured yet. The website is available normally.',503);
 if(url.origin!==PRIMARY)return fail('Use the editor at https://myprogrampartner.com/admin/ to sign in.',403);
 if(url.pathname==='/api/auth'){
  if(url.searchParams.get('provider')&&url.searchParams.get('provider')!=='github')return fail('Unsupported sign-in provider');
  let origin;try{origin=new URL('https://'+(url.searchParams.get('site_id')||'myprogrampartner.com')).origin;}catch{return fail('Invalid site');}
  if(!ORIGINS.has(origin))return fail('Unrecognized editor site',403);
  const state=base64url(crypto.getRandomValues(new Uint8Array(32))),verifier=base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge=base64url(await crypto.subtle.digest('SHA-256',encoder.encode(verifier)));
  const signed=await sign({state,verifier,origin,expires:Date.now()+600000},env.GITHUB_CLIENT_SECRET);
  const authorize=new URL('https://github.com/login/oauth/authorize');
  authorize.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:PRIMARY+'/api/callback',state,code_challenge:challenge,code_challenge_method:'S256'});
  return new Response(null,{status:302,headers:{...headers,Location:authorize.href,'Set-Cookie':COOKIE+'='+signed+'; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=600'}});
 }
 const data=await verify(cookie(request),env.GITHUB_CLIENT_SECRET);
 if(!data||data.expires<Date.now()||data.state!==url.searchParams.get('state')||!ORIGINS.has(data.origin)||!url.searchParams.get('code'))return fail('Sign-in expired or could not be verified. Close this window and try again.',403);
 try{
  const exchange=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:PRIMARY+'/api/callback',code_verifier:data.verifier})});
  const result=await exchange.json();if(!exchange.ok||!result.access_token)return fail('GitHub did not complete sign-in.',403);
  const githubHeaders={Authorization:'Bearer '+result.access_token,Accept:'application/vnd.github+json','User-Agent':'Program-Partner-Marketing-Editor'};
  const userResponse=await fetch('https://api.github.com/user',{headers:githubHeaders});const user=await userResponse.json();
  if(!userResponse.ok||user.login!=='jsenglish3'||user.id!==306899212)return fail('This editor is available only to the authorized Program Partner owner.',403);
  const repoResponse=await fetch('https://api.github.com/repos/jsenglish3/Program-Partner-Marketing-Site',{headers:githubHeaders});const repo=await repoResponse.json();
  if(!repoResponse.ok||!repo.permissions?.push)return fail('Your GitHub account needs write access to the marketing repository.',403);
  const installationsResponse=await fetch('https://api.github.com/user/installations?per_page=100',{headers:githubHeaders});const installations=await installationsResponse.json();
  if(!installationsResponse.ok)return fail('Could not verify editor installation.',403);
  const installed=installations.installations?.filter(i=>String(i.app_id)===String(env.GITHUB_APP_ID)&&i.repository_selection==='selected'&&!i.suspended_at)||[];
  if(installed.length!==1)return fail('Install the dedicated editor GitHub App on the marketing repository only.',403);
  const repositoriesResponse=await fetch('https://api.github.com/user/installations/'+installed[0].id+'/repositories?per_page=100',{headers:githubHeaders});const repositories=await repositoriesResponse.json();
  if(!repositoriesResponse.ok||repositories.total_count!==1||repositories.repositories?.[0]?.full_name!=='jsenglish3/Program-Partner-Marketing-Site')return fail('The editor App must have access to the marketing repository only.',403);
  const payload=JSON.stringify('authorization:github:success:'+JSON.stringify({token:result.access_token,provider:'github'})).replace(/</g,'\\u003c');
  const target=JSON.stringify(data.origin);
  const html='<!doctype html><meta charset="utf-8"><title>Program Partner sign-in</title><p>Completing sign-in. You can close this window when the editor opens.</p><script>const target='+target+';const payload='+payload+';if(window.opener){const listener=e=>{if(e.origin!==target||e.source!==window.opener||e.data!=="authorizing:github")return;window.removeEventListener("message",listener);window.opener.postMessage(payload,target);window.close();};window.addEventListener("message",listener);window.opener.postMessage("authorizing:github",target);}else{document.body.textContent="Open sign-in from the Program Partner editor.";}</script>';
  return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Set-Cookie':expired,'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'none'"}});
 }catch{return fail('Sign-in could not be completed. Please try again.',502);}
}};
