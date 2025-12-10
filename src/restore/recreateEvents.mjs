export default async function recreateEvents(events, guild, maps, log){
  for(const ev of events){
    try{ if(!ev.name||!ev.scheduledStartTime) continue; try{ await guild.scheduledEvents.create({ name: ev.name, scheduledStartTime: ev.scheduledStartTime, scheduledEndTime: ev.scheduledEndTime||null, entityType: ev.entityType||3, channel: ev.channelId||null, reason: 'restored' }); }catch(err){ log?.warn&&log.warn('Scheduled event create failed',{name:ev.name,err:String(err)}); } }catch(err){ log?.warn&&log.warn('Event create inner failed',{err:String(err)}); }
    await new Promise(r=>setTimeout(r,200));
  }
}
