import {imageAssets} from './image-assets.js';
const root=new URL('./',import.meta.url);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function variants(source){
 try{const url=new URL(source,root);return url.origin===root.origin&&url.pathname.startsWith(root.pathname+'uploads/')?imageAssets[url.pathname.split('/').pop()]:null;}catch{return null;}
}
function sourceSet(sources){return sources.map(item=>`${new URL(item.src,root).href} ${item.width}w`).join(', ');}
export function photoAttributes(source,sizes='(max-width: 620px) calc(100vw - 40px), (max-width: 850px) 45vw, 400px'){
 const sources=variants(source);
 if(!sources)return `src="${escape(source)}" decoding="async"`;
 const medium=sources.find(item=>item.width>=640)||sources.at(-1);
 return `src="${escape(new URL(medium.src,root).href)}" srcset="${escape(sourceSet(sources))}" sizes="${escape(sizes)}" decoding="async"`;
}
export function setPhoto(image,source,sizes='(max-width: 620px) 85vw, 520px'){
 const sources=variants(source);
 image.decoding='async';image.sizes=sizes;
 if(sources){image.srcset=sourceSet(sources);image.src=new URL((sources.find(item=>item.width>=640)||sources.at(-1)).src,root).href;}
 else{image.removeAttribute('srcset');image.src=source;}
}
