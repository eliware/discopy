import { safeName } from './helpers.mjs';
export default async function createDefaults(guild, maps, dryRun, log){
  // create 2 categories: Text Channels and Voice Channels
  const created = { categories: [], channels: [] };
  try{
    if(dryRun){ log?.info&&log.info('DRY RUN: would create categories and default channels'); return created; }
    const textCat = await guild.channels.create('Text Channels', { type: 4, reason: 'reset: create defaults' });
    created.categories.push(textCat.id);
    const voiceCat = await guild.channels.create('Voice Channels', { type: 4, reason: 'reset: create defaults' });
    created.categories.push(voiceCat.id);
    // text channel general
    const general = await guild.channels.create('general', { type: 0, parent: textCat.id, reason: 'reset: create defaults' });
    created.channels.push(general.id);
    // voice channel
    const gvc = await guild.channels.create('General VC', { type: 2, parent: voiceCat.id, reason: 'reset: create defaults' });
    created.channels.push(gvc.id);
  }catch(err){ log?.warn&&log.warn('create defaults failed',{err:String(err)}); }
  return created;
}
