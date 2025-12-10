const typeMap = { 'GUILD_TEXT':0, 'GUILD_VOICE':2, 'GUILD_CATEGORY':4, 'GUILD_NEWS':5, 'GUILD_STAGE_VOICE':13 };
export default async function createChannels(channels, guild, maps, log){
  const toCreate = channels.filter(c=>!(c.type===4||c.type==='GUILD_CATEGORY'||c.type==='category')).sort((a,b)=>(a.position||0)-(b.position||0));
  for(const ch of toCreate){
    try{
      const safeName = (typeof ch.name==='string'&&ch.name.trim())?ch.name.trim():'channel';
      let chType = ch.type;
      if(typeof chType==='string') chType = typeMap[chType]!==undefined?typeMap[chType]:chType;
      if(chType===undefined||chType===null) chType = (ch.bitrate||ch.userLimit)?2:0;
      const opts = { type: chType, topic: ch.topic||null, nsfw:!!ch.nsfw, bitrate: ch.bitrate||undefined, userLimit: ch.userLimit||undefined, rateLimitPerUser: ch.rateLimitPerUser||undefined, reason: 'restored' };
      if(ch.parentId && maps.categories[ch.parentId]) opts.parent = maps.categories[ch.parentId];
      if(Array.isArray(ch.permissionOverwrites)) opts.permissionOverwrites = ch.permissionOverwrites.map(o=>({ id: o.id, type: o.type, allow: o.allow, deny: o.deny }));
      const created = await guild.channels.create(safeName, opts).catch(async e=>{ try{ return await guild.channels.create({ name: safeName, ...opts }); }catch(e2){ throw e2; } });
      if(created && created.id) maps.channels[ch.id]=created.id;
    }catch(err){ log?.warn&&log.warn('Channel create failed',{name:ch.name,id:ch.id,err:String(err)}); }
    await new Promise(r=>setTimeout(r,300));
  }
}
