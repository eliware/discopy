export default async function recreateBans(bans, guild, maps, log){
  for(const b of bans){
    try{ if(!b.userId) continue; try{ await guild.members.ban(b.userId,{ reason: b.reason||'restored ban', deleteMessageSeconds:0 }).catch(e=>{ throw e; }); }catch(err){ log?.warn&&log.warn('Ban failed',{userId:b.userId,err:String(err)}); } }catch(err){ log?.warn&&log.warn('Ban inner failed',{err:String(err)}); }
    await new Promise(r=>setTimeout(r,150));
  }
}
