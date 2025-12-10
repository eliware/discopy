import { sleep } from './helpers.mjs';
export default async function execute(plan, guild, dryRun, log){
  const results = { roles:0, channels:0, emojis:0, stickers:0, errors:[] };
  // delete channels first
  for(const ch of plan.channels){
    try{
      const channel = guild.channels.cache.get(ch.id) || await guild.channels.fetch(ch.id).catch(()=>null);
      if(!channel){ log?.info&&log.info('Channel already missing',{id:ch.id}); continue; }
      if(dryRun){ log?.info&&log.info('DRY RUN: would delete channel',{id:ch.id,name:ch.name}); continue; }
      await channel.delete('reset: restore to default');
      results.channels++;
    }catch(err){ results.errors.push({type:'channel',id:ch.id,err:String(err)}); log?.warn&&log.warn('Channel delete failed',{id:ch.id,err:String(err)}); }
    await sleep(200);
  }

  // delete emojis
  for(const e of plan.emojis){
    try{
      const emoji = guild.emojis.cache.get(e.id);
      if(!emoji){ log?.info&&log.info('Emoji missing',{id:e.id}); continue; }
      if(dryRun){ log?.info&&log.info('DRY RUN: would delete emoji',{id:e.id,name:e.name}); continue; }
      await emoji.delete('reset'); results.emojis++;
    }catch(err){ results.errors.push({type:'emoji',id:e.id,err:String(err)}); log?.warn&&log.warn('Emoji delete failed',{id:e.id,err:String(err)}); }
    await sleep(150);
  }

  // delete stickers
  try{
    for(const s of plan.stickers){
      try{
        const sticker = guild.stickers.cache.get(s.id);
        if(!sticker){ log?.info&&log.info('Sticker missing',{id:s.id}); continue; }
        if(dryRun){ log?.info&&log.info('DRY RUN: would delete sticker',{id:s.id,name:s.name}); continue; }
        if(guild.stickers && typeof guild.stickers.delete==='function'){
          await guild.stickers.delete(s.id, 'reset');
        } else if(typeof sticker.delete==='function'){
          await sticker.delete('reset');
        }
        results.stickers++;
      }catch(err){ results.errors.push({type:'sticker',id:s.id,err:String(err)}); log?.warn&&log.warn('Sticker delete failed',{id:s.id,err:String(err)}); }
      await sleep(150);
    }
  }catch(e){ log?.warn&&log.warn('Stickers deletion loop failed',{err:String(e)}); }

  // delete roles (except everyone)
  for(const r of plan.roles){
    try{
      const role = guild.roles.cache.get(r.id) || await guild.roles.fetch(r.id).catch(()=>null);
      if(!role){ log?.info&&log.info('Role missing',{id:r.id}); continue; }
      if(dryRun){ log?.info&&log.info('DRY RUN: would delete role',{id:r.id,name:r.name}); continue; }
      // skip roles the bot cannot delete (managed or higher than bot)
      if(role.managed){ log?.info&&log.info('Skipping managed role deletion',{id:r.id}); continue; }
      await role.delete('reset'); results.roles++;
    }catch(err){ results.errors.push({type:'role',id:r.id,err:String(err)}); log?.warn&&log.warn('Role delete failed',{id:r.id,err:String(err)}); }
    await sleep(200);
  }

  return results;
}
