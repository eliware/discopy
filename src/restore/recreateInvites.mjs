export default async function recreateInvites(invites, guild, maps, log){
  for(const i of invites){
    try{
      const channelId = (i.channelId && maps.channels[i.channelId])?maps.channels[i.channelId]:i.channelId; if(!channelId) continue;
      try{ await guild.channels.cache.get(channelId).createInvite({ maxAge: i.maxAge||0, maxUses: i.maxUses||0, temporary: !!i.temporary, unique: false, reason: 'restored' }); }catch(err){ log?.warn&&log.warn('Invite create failed',{channelId,err:String(err)}); }
    }catch(err){ log?.warn&&log.warn('Invite inner failed',{err:String(err)}); }
    await new Promise(r=>setTimeout(r,150));
  }
}
