export default async function recreateWebhooks(webhooks, guild, maps, log){
  for(const w of webhooks){
    try{
      const channelId = (w.channelId && maps.channels[w.channelId])?maps.channels[w.channelId]:w.channelId; if(!channelId) continue;
      try{ const channel = guild.channels.cache.get(channelId); if(!channel||!channel.createWebhook) continue; await channel.createWebhook(w.name||'webhook',{ avatar: w.avatar||null, reason: 'restored' }); }catch(err){ log?.warn&&log.warn('Webhook create failed',{name:w.name,err:String(err)}); }
    }catch(err){ log?.warn&&log.warn('Webhook step inner failed',{err:String(err)}); }
    await new Promise(r=>setTimeout(r,200));
  }
}
