import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {optimizeImages} from './optimize-images.mjs';
const root='docs';await mkdir(root,{recursive:true});
for(const entry of await readdir('public',{withFileTypes:true})){
 if(['uploads','seed-uploads'].includes(entry.name))continue;
 await cp(path.join('public',entry.name),path.join(root,entry.name),{recursive:true});
}
await cp('public/seed-uploads',root+'/uploads',{recursive:true});
const content=JSON.parse(await readFile('data/default.json','utf8'));content.bookingEnabled=false;
function relative(value){if(typeof value==='string')return value.startsWith('/uploads/')||value.startsWith('/assets/')?'.'+value:value;if(Array.isArray(value))return value.map(relative);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,relative(v)]));return value;}
await writeFile(root+'/content.json',JSON.stringify(relative(content),null,2));
for(const name of await readdir(root)){
 if(!/\.(html|js|css)$/.test(name))continue;
 let text=await readFile(root+'/'+name,'utf8');
 text=text.replaceAll('logo-linen.png','logo-linen.webp');
 text=text.replace(/(["'`(])\/(assets|uploads)\//g,'$1./$2/');
 if(name.endsWith('.html'))text=text.replace(/(href|src)="\/(?!\/)/g,'$1="./');
 if(name==='index.html')text=text.replace('</head>',[
  'copy-defaults.js','workshop-info.js','site-settings.js','sections.js','images.js','image-assets.js','supabase-cms.js','cms-config.js'
 ].map(file=>`<link rel="modulepreload" href="./${file}">`).join('')+'\n</head>');
 if(name==='app.js')text="import {loadContent} from './supabase-cms.js';\n"+text.replace("const r = await fetch('/api/content'); if (!r.ok) throw new Error(); content = await r.json();","content = await loadContent({onUpdate: next => {content=next;content.copy={...copyDefaults,...content.copy};render();}});");
 if(name==='admin.js'){
  text="import {cmsApi as api} from './supabase-cms.js';\n"+text;
  const start=text.indexOf('async function api('),end=text.indexOf('\nfunction get(',start);
  if(start<0||end<0)throw Error('Missing adapter anchor');text=text.slice(0,start)+text.slice(end);
  text=text.replace("password:$('#password').value","email:$('#email').value,password:$('#password').value");
  text=text.replace(/6 МБ/g,'5 МБ').replace('6 * 1024 * 1024','5 * 1024 * 1024');
  text=text.replace(/<label class="inline-check">[\s\S]*?<\/label>/g,'');
 }
 if(name==='admin.html'){
  text=text.replace('<label class="field">Пароль','<label class="field">Email администратора Supabase<input id="email" type="email" value="owner@bratsk-ceramics.invalid" autocomplete="username" required></label><label class="field">Пароль');
  text=text.replace(/<p class="admin-hint">[\s\S]*?<\/p>/,'<p class="admin-hint">Вход через аккаунт владельца в Supabase.</p>');
  text=text.replace(/<p class="editor-note">[\s\S]*?<\/p>/,'<p class="editor-note">Изменения сохраняются в Supabase и видны всем посетителям после обновления сайта. Запись — через Telegram-бота и контакты мастерской.</p>');
  text=text.replace(/<button data-tab="requests"[^>]*>Заявки<\/button>/,'');
 }
 await writeFile(root+'/'+name,text);
}
await cp('hosting/supabase-cms.js',root+'/supabase-cms.js');
await cp('hosting/cms-config.js',root+'/cms-config.js');
await optimizeImages(root);
// Version entrypoints and their imports together so returning visitors receive fixes.
const files=(await readdir(root)).filter(name=>/\.(js|css|html)$/.test(name)).sort();
const hash=createHash('sha256');
hash.update(await readFile(root+'/content.json'));
for(const name of files)hash.update(await readFile(root+'/'+name));
const release=hash.digest('hex').slice(0,12);
for(const name of files){
 const source=await readFile(root+'/'+name,'utf8');
 await writeFile(root+'/'+name,source.replace(/(["'])\.\/([\w-]+\.(?:js|css))\1/g,(_,quote,file)=>`${quote}./${file}?v=${release}${quote}`));
}
await writeFile(root+'/.nojekyll','');await mkdir(root+'/admin',{recursive:true});
await writeFile(root+'/admin/index.html','<!doctype html><html lang="ru"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../admin.html"><title>Редактор мастерской</title><a href="../admin.html">Открыть редактор</a></html>');
console.log('Built GitHub Pages site and Supabase admin');
