export default async function applyOverwrites(channels, guild, maps, backupMetadata, log){
  for(const ch of channels){
    try{
      const newId = maps.channels[ch.id] || maps.categories[ch.id] || null; if(!newId) continue;
      const targetChannel = guild.channels.cache.get(newId); if(!targetChannel) continue;
      const overwrites = Array.isArray(ch.permissionOverwrites)?ch.permissionOverwrites:[];
      const formatted = [];
      for(const o of overwrites){
        try{
          const originalId = o && o.id ? String(o.id) : null;
          let target = (o && o.id && maps.roles[o.id])?maps.roles[o.id]:(o && o.id)?o.id:null;
          if(originalId && backupMetadata && originalId===String(backupMetadata.guildId)) target = guild.id; // map everyone
          if(!target) continue;
          // validate existence
          if((o.type==='role'||o.type===0||o.type==='ROLE')){
            if(!guild.roles.cache.has(target)&&target!==guild.id) continue;
          } else if(o.type==='member'||o.type===1||o.type==='MEMBER'){
            if(!guild.members.cache.has(target)) continue;
          }
          const allowVal = (typeof o.allow==='string' && /^\d+$/.test(o.allow))?o.allow:o.allow;
          const denyVal = (typeof o.deny==='string' && /^\d+$/.test(o.deny))?o.deny:o.deny;
          formatted.push({ id: target, allow: allowVal, deny: denyVal, type: o.type||'role' });
        }catch(e){ log?.warn&&log.warn('overwrite format failed',{err:String(e)}); }
      }
      if(formatted.length){
        try{ await targetChannel.permissionOverwrites.set(formatted,'restored'); }
        catch(e){ try{ for(const fo of formatted){ await targetChannel.permissionOverwrites.edit(fo.id,{ allow: fo.allow, deny: fo.deny}, 'restored'); } }catch(err2){ log?.warn&&log.warn('permission overwrite set failed',{channel:newId,err:String(err2)}); } }
      }
    }catch(err){ log?.warn&&log.warn('Apply overwrites failed for channel',{channel:ch.id,err:String(err)}); }
    await new Promise(r=>setTimeout(r,150));
  }
}
