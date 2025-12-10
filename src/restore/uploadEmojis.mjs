import fs from 'node:fs/promises';
import path from 'node:path';
export default async function uploadEmojis(emojis, guild, extractDir, maps, log){
  const fetchFn = async ()=>{ if(typeof globalThis.fetch==='function') return globalThis.fetch; const nf=await import('node-fetch'); return nf.default };
  const f = await fetchFn();
  for(const e of emojis){
    try{
      if(e.file){
        const full = path.join(extractDir,e.file);
        try{ const buffer = await fs.readFile(full); const created = await guild.emojis.create({ attachment: buffer, name: e.name||'emoji' }).catch(async err=>{ try{return await guild.emojis.create(buffer,e.name);}catch(e2){throw err;} }); if(created && created.id) maps.emojis[e.id]=created.id; }catch(err){ log?.warn&&log.warn('Emoji upload from file failed',{file:e.file,err:String(err)}); }
      } else if(e.url){ try{ const res = await f(e.url); if(res.ok){ const ab = await res.arrayBuffer(); const buffer = Buffer.from(ab); const created = await guild.emojis.create({ attachment: buffer, name: e.name||'emoji' }); if(created && created.id) maps.emojis[e.id]=created.id; } }catch(err){ log?.warn&&log.warn('Emoji upload from url failed',{url:e.url,err:String(err)}); } }
    }catch(err){ log?.warn&&log.warn('Emoji step inner failed',{err:String(err)}); }
    await new Promise(r=>setTimeout(r,300));
  }
}
