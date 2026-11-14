import sharp from 'sharp';
import {mkdir,readdir,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
export async function optimizeImages(root){
 const directory=path.join(root,'optimized','v1');await mkdir(directory,{recursive:true});
 const manifest={};let originalBytes=0,largeBytes=0,thumbnailBytes=0;
 const files=(await readdir('public/seed-uploads')).filter(file=>/\.(jpg|png|webp)$/i.test(file));
 for(let offset=0;offset<files.length;offset+=4){
  await Promise.all(files.slice(offset,offset+4).map(async file=>{
   const input=path.join('public/seed-uploads',file),stem=path.parse(file).name;
   const sources=[];const inputBytes=(await stat(input)).size;originalBytes+=inputBytes;
   for(const width of [160,640,1200]){
    const name=`${stem}-${width}w.webp`,output=path.join(directory,name);
    try{await stat(output);}catch{await sharp(input).rotate().resize({width,withoutEnlargement:true}).webp({quality:80,effort:4}).toFile(output);}
    const metadata=await sharp(output).metadata();
    sources.push({src:`./optimized/v1/${name}`,width:metadata.width});
    const outputBytes=(await stat(output)).size;
    if(width===1200)largeBytes+=outputBytes;
    if(width===160)thumbnailBytes+=outputBytes;
   }
   manifest[file]=sources.filter((source,index,array)=>array.findIndex(item=>item.width===source.width)===index);
  }));
 }
 await sharp('public/assets/brand/logo-linen.png').resize({width:720,withoutEnlargement:true}).webp({quality:90,effort:4}).toFile(path.join(root,'assets/brand/logo-linen.webp'));
 await writeFile(path.join(root,'image-assets.js'),'export const imageAssets='+JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a],[b])=>a.localeCompare(b))))+';\n');
 console.log(JSON.stringify({photos:files.length,originalBytes,largeBytes,thumbnailBytes,logoBytes:(await stat(path.join(root,'assets/brand/logo-linen.webp'))).size}));
}
