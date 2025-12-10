export default async function createRoles(backup, guild, maps, log){
  // backup may be the full parsed backup (with data.roles) or a direct roles array;
  const roles = Array.isArray(backup?.data?.roles) ? backup.data.roles : (Array.isArray(backup.roles) ? backup.roles : []);
  const metadata = backup._metadata || backup.metadata || {};
  let everyonePerms = null;
  for(const r of roles.sort((a,b)=>(b.position||0)-(a.position||0))){
    try{
      // detect everyone: id equals backup metadata guildId
      if(r.id && metadata && String(r.id)===String(metadata.guildId)){
        everyonePerms = (r.permissions===undefined||r.permissions===null)?null:r.permissions;
        log?.info&&log.info('Captured everyone perms');
        continue;
      }
      if(r.managed){log?.info&&log.info('Skipping managed role',{name:r.name,id:r.id});continue}
      const perms = (r.permissions===null||r.permissions===undefined)?undefined:r.permissions;
      let created;
      try{ created = await guild.roles.create({ name: r.name||'role', colors: r.color||null, hoist: !!r.hoist, permissions: perms, mentionable: !!r.mentionable, reason: 'restored' }); }
      catch(e){ try{ created = await guild.roles.create({ name: r.name||'role', color: r.color||null, hoist: !!r.hoist, permissions: perms, mentionable: !!r.mentionable, reason: 'restored' }); }catch(e2){ created=null; throw e2; } }
      if(created && created.id) maps.roles[r.id]=created.id;
    }catch(err){ log?.warn&&log.warn('Role create failed',{role:r.name,err:String(err)}); }
    await new Promise(r=>setTimeout(r,250));
  }
  // apply everyone perms
  try{
    if(everyonePerms!==null&&everyonePerms!==undefined){
      try{
        const everyoneRole = guild.roles.everyone || (guild.roles && guild.roles.cache && guild.roles.cache.get(guild.id));
        if(everyoneRole && typeof everyoneRole.setPermissions==='function'){
          await everyoneRole.setPermissions(everyonePerms);
          log?.info&&log.info('Applied @everyone permissions');
        } else if(everyoneRole && typeof guild.roles.edit==='function'){
          await guild.roles.edit(everyoneRole.id,{permissions:everyonePerms});
          log?.info&&log.info('Edited @everyone role permissions via guild.roles.edit');
        } else {
          log?.warn&&log.warn('Unable to apply permissions to @everyone role — API not available');
        }
      }catch(err){ log?.warn&&log.warn('Applying everyone role permissions failed',{err:String(err)}); }
    }
  }catch(err){ /* ignore */ }

  // set positions best-effort
  try{
    const positions = [];
    for(const r of roles) if(maps.roles[r.id]) positions.push({id:maps.roles[r.id],position:(r.position||0)});
    if(positions.length) await guild.roles.setPositions(positions).catch(e=>log?.warn&&log.warn('setPositions failed',{err:String(e)}));
  }catch(e){}
}
