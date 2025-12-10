import fs from 'node:fs/promises';
import path from 'node:path';
export default async function uploadStickers(stickers, guild, extractDir, maps, log){
  for(const s of stickers){
    try{
      if(s.file){
        const full = path.join(extractDir,s.file);
        try{ const buffer = await fs.readFile(full); if(guild.stickers && typeof guild.stickers.create==='function'){ try{ const created = await guild.stickers.create({ name: s.name||'sticker', description: s.description||'', tags: s.tags||'', file: buffer, reason: 'restored' }); if(created && created.id) maps.stickers[s.id]=created.id; }catch(err){ log?.warn&&log.warn('guild.stickers.create failed',{err:String(err)}); } } else log?.info&&log.info('Sticker create not supported',{name:s.name}); }catch(err){ log?.warn&&log.warn('Sticker upload from file failed',{file:s.file,err:String(err)}); }
      }
    }catch(err){ log?.warn&&log.warn('Sticker step inner failed',{err:String(err)}); }
    await new Promise(r=>setTimeout(r,300));
  }
}
