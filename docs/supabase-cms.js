import {config} from './cms-config.js?v=664be32b6bf4';
let clientPromise,version;
const root=new URL('./',import.meta.url);
function paths(value){
 if(typeof value==='string'&&/^(?:\.\/|\/)(?:assets|uploads)\//.test(value))return new URL(value.replace(/^\//,'./'),root).href;
 if(Array.isArray(value))return value.map(paths);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,paths(v)]));
 return value;
}
async function client(){
 clientPromise??=import('https://esm.sh/@supabase/supabase-js@2.49.1').then(({createClient})=>createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:sessionStorage,storageKey:'bratsk-workshop-admin'}}));return clientPromise;
}
function check(result){if(result.error)throw Error(result.error.message||'Ошибка Supabase.');return result.data;}
const cacheKey='workshop-public-v3:'+config.url+root.pathname;
function validContent(data){return data&&typeof data.name==='string'&&Array.isArray(data.courses)&&Array.isArray(data.gallery);}
function remember(data){try{localStorage.setItem(cacheKey,JSON.stringify(data));}catch{/* Storage may be disabled. */}}
async function bundledContent(){
 const url=new URL('content.json',root);url.search=new URL(import.meta.url).search;
 const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw Error('Не удалось загрузить сайт.');
 const data=await response.json();if(!validContent(data))throw Error('Неверный формат данных сайта.');return paths({...data,bookingEnabled:false});
}
async function remoteContent(){
 const url=new URL('/rest/v1/site_content',config.url);url.search=new URLSearchParams({id:'eq.'+config.record,select:'data,updated_at'});
 const response=await fetch(url,{headers:{apikey:config.key},signal:AbortSignal.timeout(10000),cache:'no-store'});
 if(!response.ok)throw Error('Не удалось загрузить данные Supabase.');
 const rows=await response.json();version=rows[0]?.updated_at??null;
 if(!rows[0])return null;
 if(!validContent(rows[0].data))throw Error('Неверный формат данных Supabase.');
 return paths({...rows[0].data,bookingEnabled:false});
}
export async function loadContent({admin=false,onUpdate}={}){
 // Editor reads are always authoritative; stale data must never be saved over newer edits.
 if(admin)return (await remoteContent())||bundledContent();
 const remote=remoteContent().then(data=>({data}),error=>({error}));
 let initial;try{const cached=JSON.parse(localStorage.getItem(cacheKey));if(validContent(cached))initial=paths({...cached,bookingEnabled:false});}catch{/* Use the bundled snapshot. */}
 if(!initial){try{initial=await bundledContent();}catch(error){const fresh=await remote;if(!fresh.data)throw error;initial=fresh.data;}}
 const initialSignature=JSON.stringify(initial);
 remote.then(({data})=>{
  if(!data)return;remember(data);
  if(onUpdate&&JSON.stringify(data)!==initialSignature)setTimeout(()=>onUpdate(data),0);
 });
 return initial;
}
async function owner(db){
 const {user}=check(await db.auth.getUser());if(!user)throw Error('Войдите в аккаунт владельца.');
 if(!check(await db.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle()))throw Error('У аккаунта нет прав администратора.');
}
export async function cmsApi(url,options={}){
 const db=await client();
 if(url.endsWith('/login')){
  const {email,password}=JSON.parse(options.body);const result=await db.auth.signInWithPassword({email,password});
  if(result.error)throw Error('Не удалось войти. Проверьте email и пароль Supabase.');
  try{await owner(db);}catch(error){await db.auth.signOut();throw error;}return {ok:true};
 }
 if(url.endsWith('/logout')){check(await db.auth.signOut());return {ok:true};}
 try{await owner(db);}catch(error){document.querySelector('#editor').hidden=true;document.querySelector('#login-panel').hidden=false;throw error;}
 if(url==='/api/admin/session')return {ok:true};
 if(url==='/api/content')return loadContent({admin:true});
 if(url==='/api/admin/content'){
  const data=JSON.parse(options.body);data.bookingEnabled=false;
  const compact=JSON.parse(JSON.stringify(data),(_,v)=>typeof v==='string'&&v.startsWith(root.href)?'./'+v.slice(root.href.length):v);
  if(new TextEncoder().encode(JSON.stringify(compact)).length>95000)throw Error('Объём контента превышает лимит. Уменьшите количество длинных текстов.');
  const result=version?await db.from('site_content').update({data:compact}).eq('id',config.record).eq('updated_at',version).select('updated_at'):await db.from('site_content').insert({id:config.record,section:'Мастерская — сайт и админка',label:'Текущий сайт',kind:'settings',data:compact,published:true,position:10000}).select('updated_at');
  const changed=check(result);if(!changed.length)throw Error('Сайт изменён в другой вкладке. Обновите редактор перед сохранением.');version=changed[0].updated_at;remember(compact);return {ok:true};
 }
 if(url==='/api/admin/upload'){
  const file=options.body,b=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const type=b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)?'image/png':String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP'?'image/webp':'';
  if(!type||file.type!==type||!file.size||file.size>5*1024*1024)throw Error('Нужен настоящий JPG, PNG или WebP до 5 МБ.');
  const bitmap=await createImageBitmap(file),valid=bitmap.width<=12000&&bitmap.height<=12000;
  if(!valid){bitmap.close();throw Error('Фото должно быть не больше 12000 × 12000.');}
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const compressed=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));
  const upload=compressed?.type==='image/webp'&&(scale<1||compressed.size<file.size)?compressed:file;
  const name=crypto.randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[upload.type]);
  check(await db.storage.from(config.bucket).upload(name,upload,{contentType:upload.type,cacheControl:'31536000',upsert:false}));return {image:db.storage.from(config.bucket).getPublicUrl(name).data.publicUrl};
 }
 if(url==='/api/admin/requests')return [];
 throw Error('Операция не поддерживается.');
}
