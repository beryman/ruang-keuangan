/* Supabase Auth + sinkronisasi snapshot privat (v10).
   - Baseline disimpan benar & dilacak per bagian (keuangan / Kos).
   - Sidik jari kanonis: urutan key & penanda waktu meta Kos tidak dianggap perubahan.
   - Tulis ke cloud memakai update bersyarat (compare-and-swap) agar dua perangkat tidak saling menimpa.
   - Konflik diselesaikan otomatis (gabung transaksi / pilih yang terbaru) + cadangan lokal; tanpa reload halaman.
   - Gangguan jaringan/server tidak mematikan sinkronisasi otomatis; dicoba lagi dengan jeda bertahap. */
(()=>{'use strict';
const K={config:'uangku-supabase-config',session:'uangku-supabase-session',auto:'uangku-supabase-autosync',remote:'uangku-supabase-last-remote',
  choice:'uangku-supabase-needs-choice',status:'uangku-supabase-status',baseW:'uangku-sb-base-wallet',baseK:'uangku-sb-base-kos',
  changed:'uangku-sb-local-changed',backups:'uangku-sb-backups',legacyBase:'uangku-supabase-baseline'};
const WALLET_KEY='ruang-keuangan-v2',KOS_KEY='kosman_v55_v3_full_access',KOS_FORCE_KEY='kosman_cloud_force_local';
const PARTS=['wallet','kos'],BASE_KEY={wallet:K.baseW,kos:K.baseK};

/* ---------- util penyimpanan ---------- */
const ls={get:k=>{try{return localStorage.getItem(k)}catch(_){return null}},set:(k,v)=>{try{localStorage.setItem(k,v);return true}catch(_){return false}},del:k=>{try{localStorage.removeItem(k)}catch(_){}}};
const read=(k,fb=null)=>{try{const v=JSON.parse(ls.get(k));return v??fb}catch(_){return fb}};
const write=(k,v)=>ls.set(k,JSON.stringify(v));
const config=()=>read(K.config,{url:'',key:''}),session=()=>read(K.session,null);
const mkErr=(m,props)=>Object.assign(new Error(m),props||{});
function status(message){message=String(message);ls.set(K.status,message);try{window.dispatchEvent(new CustomEvent('uangku-supabase-status',{detail:message}))}catch(_){}}
const hhmm=()=>new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
function setConfig(url,key){url=String(url||'').trim().replace(/\/$/,'');key=String(key||'').trim();if(!/^https:\/\/[\w.-]+$/.test(url))throw Error('Project URL Supabase tidak valid.');if(!key)throw Error('Anon/public key belum diisi.');write(K.config,{url,key});return true}

/* ---------- sidik jari kanonis ---------- */
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v)}
function canon(part,str){
  if(str===null||str===undefined||str==='')return 'null';
  let o;try{o=JSON.parse(str)}catch(_){return 'raw:'+str}
  if(part==='kos'&&o&&typeof o==='object'&&o.meta&&typeof o.meta==='object'){const m={...o.meta};delete m.updatedAt;delete m.rev;o={...o,meta:m}}
  return stable(o)}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)+':'+s.length}
const ph=(part,str)=>hash(canon(part,str)),NULLH=hash('null');
const localParts=()=>({wallet:ls.get(WALLET_KEY),kos:ls.get(KOS_KEY)});
const remoteParts=r=>({wallet:r?.payload?.wallet??null,kos:r?.payload?.kos??null});

/* ---------- cadangan sebelum data lokal diganti ---------- */
function backup(reason){
  const p=localParts();if(!p.wallet&&!p.kos)return;
  const list=read(K.backups,[]);list.unshift({at:new Date().toISOString(),reason,wallet:p.wallet,kos:p.kos});
  while(list.length>3)list.pop();
  if(!write(K.backups,list)){list.length=1;write(K.backups,list)}}
const backups=()=>read(K.backups,[]).map((b,i)=>({index:i,at:b.at,reason:b.reason}));

/* ---------- jaringan ---------- */
function fetchT(url,opts,ms=25000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(url,{...opts,signal:c.signal}).finally(()=>clearTimeout(t))}
let refreshPromise=null;
async function refreshUnlocked(force,stale){
  let s=session();if(!s?.refresh_token)return null;
  if(force){if(s.access_token!==stale)return s}else if(s.expires_at&&s.expires_at>Date.now()/1000+90)return s;
  const c=config();if(!c.url||!c.key)throw mkErr('Konfigurasi Supabase belum lengkap.');
  let res;try{res=await fetchT(c.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})})}
  catch(_){throw mkErr('Tidak bisa menyegarkan sesi karena koneksi internet gagal. Sesi tetap disimpan; coba lagi saat online.',{net:true})}
  const raw=await res.text();let next={};try{next=raw?JSON.parse(raw):{}}catch(_){next={}}
  if(!res.ok){const msg=next.msg||next.message||next.error_description||next.error||'Sesi Supabase perlu login ulang.';
    if(res.status===400||res.status===401){ls.del(K.session);ls.del(K.auto);status('Sesi perlu diperbarui. Silakan login kembali: '+msg);throw mkErr(msg,{status:res.status,auth:true})}
    throw mkErr(msg,{status:res.status})}
  if(!next.user&&s.user)next.user=s.user;
  next.expires_at=Date.now()/1000+Number(next.expires_in||3600);write(K.session,next);return next}
function refresh(force=false,stale=null){
  if(refreshPromise)return refreshPromise;
  const run=()=>refreshUnlocked(force,stale);
  refreshPromise=(navigator.locks?.request?navigator.locks.request('uangku-supabase-refresh',{mode:'exclusive'},run):run()).finally(()=>{refreshPromise=null});
  return refreshPromise}
async function api(path,{method='GET',body,token,headers:extra={},retryAuth=true}={}){
  const c=config();if(!c.url||!c.key)throw mkErr('Simpan Project URL dan anon/public key Supabase terlebih dahulu.');
  const headers={apikey:c.key,'Content-Type':'application/json',...extra};if(token)headers.Authorization='Bearer '+token;
  let res;try{res=await fetchT(c.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)})}
  catch(e){throw mkErr('Supabase tidak terjangkau. Periksa internet, Project URL, dan pengaturan CORS jaringan. '+(e.name==='AbortError'?'(waktu habis)':(e.message||'')),{net:true})}
  const raw=await res.text();let data={};try{data=raw?JSON.parse(raw):{}}catch(_){data={message:raw}}
  if(!res.ok){
    if(res.status===401&&retryAuth&&token&&session()?.refresh_token){const s=await refresh(true,token);if(s?.access_token)return api(path,{method,body,token:s.access_token,headers:extra,retryAuth:false})}
    throw mkErr(data.msg||data.message||data.error_description||data.error||'Supabase error '+res.status,{status:res.status,code:data.code})}
  return data}
const uidOf=s=>{if(s?.user?.id)return s.user.id;try{return JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub}catch(_){return null}};
async function signUp(email,password){const r=await api('/auth/v1/signup',{method:'POST',body:{email,password}});if(r.access_token){r.expires_at=Date.now()/1000+Number(r.expires_in||3600);write(K.session,r)}return r}
async function getRemote(){
  const s=await refresh();if(!s?.access_token)throw mkErr('Silakan login ke Supabase.',{auth:true});
  const rows=await api('/rest/v1/app_snapshots?select=payload,updated_at&user_id=eq.'+encodeURIComponent(uidOf(s))+'&limit=1',{token:s.access_token});
  return Array.isArray(rows)?(rows[0]||null):null}
/* true = tersimpan; false = ada perangkat lain yang menulis lebih dulu (ulangi) */
async function writeRemote(s,remote,payload,force){
  const uid=uidOf(s),updated_at=new Date().toISOString();
  if(force){await api('/rest/v1/app_snapshots?on_conflict=user_id',{method:'POST',token:s.access_token,body:{user_id:uid,payload,updated_at},headers:{Prefer:'resolution=merge-duplicates,return=representation'}});return true}
  if(!remote){
    try{await api('/rest/v1/app_snapshots',{method:'POST',token:s.access_token,body:{user_id:uid,payload,updated_at},headers:{Prefer:'return=representation'}});return true}
    catch(e){if(e.status===409||e.code==='23505'||/duplicate key/i.test(e.message))return false;throw e}}
  const rows=await api('/rest/v1/app_snapshots?user_id=eq.'+encodeURIComponent(uid)+'&updated_at=eq.'+encodeURIComponent(remote.updated_at),{method:'PATCH',token:s.access_token,body:{payload,updated_at},headers:{Prefer:'return=representation'}});
  return Array.isArray(rows)&&rows.length>0}

/* ---------- penggabungan ---------- */
const parseJ=s=>{try{return s?JSON.parse(s):null}catch(_){return null}};
function mergeWallet(l,r,localNewer){
  const L=parseJ(l),R=parseJ(r);if(!L||typeof L!=='object')return r;if(!R||typeof R!=='object')return l;
  const primary=localNewer?L:R,other=localNewer?R:L,out={...other,...primary},seen=new Map();
  const add=(t,preferred)=>{const k=t&&t.id!==undefined&&t.id!==null?'id:'+t.id:'h:'+stable(t);if(!seen.has(k)||preferred)seen.set(k,t)};
  (Array.isArray(other.transactions)?other.transactions:[]).forEach(t=>add(t,false));
  (Array.isArray(primary.transactions)?primary.transactions:[]).forEach(t=>add(t,true));
  out.transactions=[...seen.values()];return JSON.stringify(out)}
function pickKos(l,r,localNewer){
  const L=parseJ(l),R=parseJ(r);if(!L)return r;if(!R)return l;
  const lr=Number(L.meta?.rev)||0,rr=Number(R.meta?.rev)||0;if(lr!==rr)return lr>rr?l:r;
  const lt=Date.parse(L.meta?.updatedAt||0)||0,rt=Date.parse(R.meta?.updatedAt||0)||0;if(lt!==rt)return lt>rt?l:r;
  return localNewer?l:r}
function decide(part,l,r){
  const lh=ph(part,l),rh=ph(part,r),base=ls.get(BASE_KEY[part]);
  if(lh===rh)return 'same';
  if(base&&base===rh)return 'push';
  if(base&&base===lh)return 'pull';
  if(rh===NULLH)return 'push';
  if(lh===NULLH)return 'pull';
  return 'merge'}

/* ---------- menerapkan data ke perangkat (tanpa reload) ---------- */
function hasDraft(){
  try{
    if(document.querySelector('#modal.open,#goalModal.open'))return true;
    if(document.querySelector('#draftMerchant')?.value||document.querySelector('#draftTotal')?.value||document.querySelector('#receiptFile')?.files?.length||document.querySelector('#receiptCamera')?.files?.length)return true;
    const d=document.querySelector('.kosAppFrame')?.contentDocument;if(d&&d.querySelector('.modal-bg.open,dialog[open]'))return true;
  }catch(_){}
  return false}
async function applyLocal(final,before){
  let walletChanged=false,kosChanged=false;
  if(ph('wallet',final.wallet)!==ph('wallet',before.wallet)){if(final.wallet)ls.set(WALLET_KEY,final.wallet);else ls.del(WALLET_KEY);walletChanged=true}
  if(ph('kos',final.kos)!==ph('kos',before.kos)){if(final.kos){ls.set(KOS_KEY,final.kos);ls.set(KOS_FORCE_KEY,'1')}else{ls.del(KOS_KEY);ls.del(KOS_FORCE_KEY)}kosChanged=true}
  if(kosChanged&&final.kos){
    try{const w=document.querySelector('.kosAppFrame')?.contentWindow;if(w?.KosManDiagnostics?.importState)await w.KosManDiagnostics.importState(JSON.parse(final.kos))}catch(_){}}
  if(walletChanged){
    try{if(window.UangkuApp?.reloadFromStorage)window.UangkuApp.reloadFromStorage();else if(!window.__uangkuNoReload)window.__uangkuPendingReload=true}catch(_){}}
  return {walletChanged,kosChanged}}
function markBases(final){PARTS.forEach(p=>ls.set(BASE_KEY[p],ph(p,final[p])));ls.set(K.remote,new Date().toISOString())}

/* ---------- siklus sinkronisasi ---------- */
let lastSeen={wallet:null,kos:null};
function noteLocalChange(){const l=localParts();let ch=false;PARTS.forEach(p=>{const h=ph(p,l[p]);if(lastSeen[p]!==null&&lastSeen[p]!==h)ch=true;lastSeen[p]=h});if(ch)ls.set(K.changed,String(Date.now()))}
const localChangedAt=()=>Number(ls.get(K.changed))||0;
async function syncCycle({manual=false}={}){
  let outcome='same';
  for(let attempt=0;attempt<4;attempt++){
    const s=await refresh();if(!s?.access_token)throw mkErr('Silakan login ke Supabase.',{auth:true});
    const remote=await getRemote(),L=localParts(),R=remoteParts(remote);
    noteLocalChange();
    const localNewer=localChangedAt()>=(Date.parse(remote?.updated_at||0)||0);
    const final={},acts={};let conflict=false;
    for(const p of PARTS){
      const a=decide(p,L[p],R[p]);acts[p]=a;
      if(a==='same'||a==='push')final[p]=L[p];
      else if(a==='pull')final[p]=R[p];
      else{conflict=true;final[p]=p==='wallet'?mergeWallet(L.wallet,R.wallet,localNewer):pickKos(L.kos,R.kos,localNewer)}}
    const needApply=PARTS.some(p=>ph(p,final[p])!==ph(p,L[p])),needPush=PARTS.some(p=>ph(p,final[p])!==ph(p,R[p]));
    if(needApply&&hasDraft()&&!manual)throw mkErr('draft',{draft:true});
    if(needPush){
      const ok=await writeRemote(s,remote,{wallet:final.wallet,kos:final.kos,updated_at:new Date().toISOString()},false);
      if(!ok)continue}
    if(needApply){
      const L2=localParts();if(PARTS.some(p=>ph(p,L2[p])!==ph(p,L[p])))continue;
      if(PARTS.some(p=>L[p]&&ph(p,final[p])!==ph(p,L[p])))backup(conflict?'Sebelum penggabungan otomatis':'Sebelum memakai data cloud');
      await applyLocal(final,L)}
    markBases(final);lastSeen={wallet:ph('wallet',final.wallet),kos:ph('kos',final.kos)};
    outcome=conflict?'merged':needApply?(needPush?'merged':'pulled'):needPush?'pushed':'same';
    return outcome}
  throw mkErr('Cloud sedang diubah dari perangkat lain.',{transient:true})}
function outcomeMessage(o){
  const t=' ('+hhmm()+')';
  if(o==='pushed')return 'Perubahan tersimpan ke cloud'+t+'.';
  if(o==='pulled')return 'Data terbaru dari cloud sudah diterapkan'+t+'.';
  if(o==='merged')return 'Data dua perangkat digabung otomatis'+t+'. Salinan data lama tersimpan sebagai cadangan.';
  return 'Sinkronisasi aktif · data sudah terbaru'+t+'.'}

let chain=Promise.resolve();
function exclusive(fn){const p=chain.then(()=>fn());chain=p.catch(()=>{});return p}
let timer=null,autoP=null,autoDirty=false,failCount=0;
const autoEnabled=()=>ls.get(K.auto)==='1';
const eligible=()=>autoEnabled()&&!!session()?.refresh_token;
function schedule(delay=1200){if(!eligible())return;clearTimeout(timer);timer=setTimeout(()=>{reconcile()},delay)}
function reconcile(){
  if(!eligible())return Promise.resolve();
  if(!navigator.onLine){status('Offline · perubahan tetap tersimpan di perangkat dan dikirim saat online.');return Promise.resolve()}
  if(autoP){autoDirty=true;return autoP}
  autoP=exclusive(async()=>{
    try{const o=await syncCycle();failCount=0;status(outcomeMessage(o))}
    catch(e){
      if(e.draft){status('Ada isian yang belum disimpan; sinkronisasi cloud menunggu sampai isian selesai.');schedule(8000);return}
      if(e.auth&&!session()){status('Sesi berakhir. Silakan login kembali untuk melanjutkan sinkronisasi.');return}
      failCount++;const wait=Math.min(300000,5000*Math.pow(2,failCount-1));
      status('Sinkronisasi tertunda: '+friendlyError(e.message)+' · dicoba lagi otomatis.');schedule(wait)}
  }).finally(()=>{autoP=null;if(autoDirty){autoDirty=false;schedule(400)}});
  return autoP}
function setAutoSync(enabled){if(enabled){ls.set(K.auto,'1');ls.del(K.choice);schedule(300)}else{ls.del(K.auto);clearTimeout(timer)}return true}
const needsChoice=()=>false;

/* ---------- aksi manual ---------- */
async function signIn(email,password){
  const r=await api('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
  r.expires_at=Date.now()/1000+Number(r.expires_in||3600);write(K.session,r);ls.del(K.choice);ls.set(K.auto,'1');
  try{const o=await exclusive(()=>syncCycle({manual:true}));failCount=0;status('Login berhasil. '+outcomeMessage(o))}
  catch(e){status('Login berhasil dan tersimpan di perangkat ini, tetapi sinkronisasi pertama tertunda: '+friendlyError(e.message));schedule(5000)}
  return r}
async function signOut(){
  const s=session();
  try{if(s?.access_token)await api('/auth/v1/logout',{method:'POST',token:s.access_token,retryAuth:false})}catch(_){}
  finally{[K.session,K.auto,K.baseW,K.baseK,K.choice,K.remote,K.legacyBase].forEach(ls.del);clearTimeout(timer);status('Keluar dari Supabase. Data lokal perangkat tidak dihapus.')}}
async function syncNow(){
  setAutoSync(true);
  const o=await exclusive(()=>syncCycle({manual:true}));failCount=0;status(outcomeMessage(o));return o}
async function pushLocal({force=false}={}){
  if(!force){const o=await exclusive(()=>syncCycle({manual:true}));status(outcomeMessage(o));return getRemote()}
  return exclusive(async()=>{
    const s=await refresh();if(!s?.access_token)throw mkErr('Silakan login ke Supabase.',{auth:true});
    const p=localParts();await writeRemote(s,null,{wallet:p.wallet,kos:p.kos,updated_at:new Date().toISOString()},true);
    markBases(p);lastSeen={wallet:ph('wallet',p.wallet),kos:ph('kos',p.kos)};ls.set(K.auto,'1');
    status('Data perangkat ini diunggah dan menggantikan cloud ('+hhmm()+').');return getRemote()})}
async function pullRemote(){
  return exclusive(async()=>{
    const remote=await getRemote();if(!remote)throw mkErr('Belum ada data di Supabase. Pilih Unggah perangkat ini terlebih dahulu.');
    const R=remoteParts(remote),L=localParts();
    if(R.wallet)JSON.parse(R.wallet);if(R.kos)JSON.parse(R.kos);
    backup('Sebelum pulihkan dari cloud');
    const final={wallet:R.wallet??L.wallet,kos:R.kos??L.kos};
    await applyLocal(final,L);markBases(final);lastSeen={wallet:ph('wallet',final.wallet),kos:ph('kos',final.kos)};ls.set(K.auto,'1');
    status('Data Supabase dipulihkan dan sinkronisasi otomatis aktif ('+hhmm()+').');
    if(!window.UangkuApp?.reloadFromStorage)setTimeout(()=>location.reload(),400)})}
async function restoreBackup(i=0){
  const b=read(K.backups,[])[i];if(!b)throw Error('Cadangan tidak ditemukan.');
  return exclusive(async()=>{
    const L=localParts();backup('Sebelum memulihkan cadangan');
    const final={wallet:b.wallet??L.wallet,kos:b.kos??L.kos};
    await applyLocal(final,L);status('Cadangan dipulihkan ('+hhmm()+'). Perubahan akan dikirim ke cloud.');schedule(500)})}

/* ---------- pemicu otomatis ---------- */
window.addEventListener('storage',e=>{if([WALLET_KEY,KOS_KEY].includes(e.key))schedule()});
window.addEventListener('online',()=>schedule(300));
window.addEventListener('focus',()=>schedule(300));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(300);else if(eligible())reconcile()});
setInterval(()=>{if(document.visibilityState==='visible')reconcile()},30000);
{const hadLegacy=ls.get(K.choice)==='1'||ls.get(K.legacyBase)!==null;ls.del(K.choice);ls.del(K.legacyBase);if(hadLegacy&&session()?.refresh_token)ls.set(K.auto,'1')}
{const l=localParts();lastSeen={wallet:ph('wallet',l.wallet),kos:ph('kos',l.kos)}}

/* ---------- konfigurasi server, reset password, pesan error ---------- */
let envOk=false,recoveryToken=null;
(function(){const h=location.hash.replace(/^#/,'');if(!h)return;const q=new URLSearchParams(h);if(q.get('type')==='recovery'&&q.get('access_token')){recoveryToken=q.get('access_token');history.replaceState(null,'',location.pathname+location.search)}else if(q.get('error_description')){status('Tautan tidak valid atau kedaluwarsa: '+q.get('error_description'));history.replaceState(null,'',location.pathname+location.search)}})();
async function loadEnvConfig(){try{const r=await fetch('./api/config',{cache:'no-store'});if(!r.ok)return false;const d=await r.json();if(d&&d.configured&&d.url&&d.key){const c=config();if(c.url!==d.url||c.key!==d.key)setConfig(d.url,d.key);envOk=true;return true}}catch(_){}return false}
const ready=loadEnvConfig().then(ok=>{schedule(800);return ok});
async function recover(email){email=String(email||'').trim();if(!email)throw Error('Isi email terlebih dahulu.');await api('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/'),{method:'POST',body:{email}});return true}
async function updatePassword(password){if(!recoveryToken)throw Error('Tautan reset password sudah tidak berlaku. Minta tautan baru.');if(String(password||'').length<6)throw Error('Password baru minimal 6 karakter.');await api('/auth/v1/user',{method:'PUT',token:recoveryToken,body:{password},retryAuth:false});recoveryToken=null;status('Password berhasil diganti. Silakan masuk dengan password baru.');return true}
function friendlyError(m){m=String(m||'');
  if(/invalid login credentials/i.test(m))return 'Email atau password salah.';
  if(/email not confirmed/i.test(m))return 'Email belum diverifikasi. Buka email dari Supabase, klik tautan verifikasinya, lalu masuk lagi.';
  if(/already (been )?registered|user already/i.test(m))return 'Email ini sudah terdaftar. Pilih tab Masuk.';
  if(/password should be at least|weak password|password.*characters/i.test(m))return 'Password minimal 6 karakter.';
  if(/rate limit|too many|security purposes/i.test(m))return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
  if(/invalid api key|no api key|apikey/i.test(m))return 'Anon/public key tidak valid. Periksa bagian Koneksi database.';
  if(/app_snapshots|schema cache|does not exist|PGRST20[0-9]/i.test(m))return 'Tabel database belum dibuat. Jalankan supabase/schema.sql di SQL Editor Supabase.';
  if(/jwt expired|invalid jwt/i.test(m))return 'Sesi kedaluwarsa. Silakan masuk kembali.';
  return m||'Terjadi kesalahan.'}
const userEmail=()=>session()?.user?.email||'';
window.SupabaseSync={ready,envConfigured:()=>envOk,recover,updatePassword,recoveryPending:()=>!!recoveryToken,friendlyError,userEmail,config,session,setConfig,signUp,signIn,signOut,getRemote,pushLocal,pullRemote,setAutoSync,autoEnabled,schedule,reconcile,syncNow,restoreBackup,backups,lastStatus:()=>ls.get(K.status)||'',needsChoice};
})();
