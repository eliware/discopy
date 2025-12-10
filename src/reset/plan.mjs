// Plan what to delete
export default async function plan(guild, log){
  const plan = { roles: [], channels: [], emojis: [], stickers: [] };
  try{
    // roles except everyone
    if(guild.roles && guild.roles.cache){
      for(const r of guild.roles.cache.values()){
        if(String(r.id)===String(guild.id)) continue; // skip @everyone
        plan.roles.push({ id: r.id, name: r.name, managed: r.managed });
      }
    }
    // channels
    if(guild.channels && guild.channels.cache){ for(const c of guild.channels.cache.values()){ plan.channels.push({ id: c.id, name: c.name, type: c.type }); } }
    // emojis
    if(guild.emojis && guild.emojis.cache){ for(const e of guild.emojis.cache.values()){ plan.emojis.push({ id: e.id, name: e.name }); } }
    // stickers
    if(guild.stickers && guild.stickers.cache){ for(const s of guild.stickers.cache.values()){ plan.stickers.push({ id: s.id, name: s.name }); } }
  }catch(err){ log?.warn&&log.warn('Plan failed',{err:String(err)}); }
  return plan;
}
