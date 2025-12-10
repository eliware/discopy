import fs from 'node:fs/promises';
import path from 'node:path';
export default async function applyGuildSettings(backupGuild, guild, maps, extractDir, log){
  try{
    const g = backupGuild || {};
    const editPayload = {};
    if(g.name) editPayload.name = g.name;
    if(g.description) editPayload.description = g.description;
    if(g.preferredLocale) editPayload.preferredLocale = g.preferredLocale;
    if(g.verificationLevel!==undefined&&g.verificationLevel!==null) editPayload.verificationLevel = g.verificationLevel;
    if(g.explicitContentFilter!==undefined&&g.explicitContentFilter!==null) editPayload.explicitContentFilter = g.explicitContentFilter;
    if(g.afkTimeout!==undefined&&g.afkTimeout!==null) editPayload.afkTimeout = g.afkTimeout;
    if(g.afkChannelId&&maps.channels[g.afkChannelId]) editPayload.afkChannelId = maps.channels[g.afkChannelId];
    if(Object.keys(editPayload).length){
      try{ await guild.edit(editPayload,'restored'); }catch(err){ try{ if(editPayload.name) await guild.setName(editPayload.name);}catch(e){log?.warn&&log.warn('setName failed',{err:String(e)})} try{ if(editPayload.description) await guild.setDescription(editPayload.description);}catch(e){log?.warn&&log.warn('setDescription failed',{err:String(e)})} try{ if(editPayload.afkTimeout!==undefined) await guild.setAFKTimeout(editPayload.afkTimeout);}catch(e){} try{ if(editPayload.afkChannelId) await guild.setAFKChannel(editPayload.afkChannelId);}catch(e){} }
    }
    if(g.file){
      const iconPath = path.join(extractDir,g.file);
      try{ const buffer = await fs.readFile(iconPath); try{ await guild.setIcon(buffer,'restored'); }catch(err2){ log?.warn&&log.warn('guild.setIcon failed',{err:String(err2)}); } }catch(err){ log?.warn&&log.warn('Failed to read icon file for restore',{err:String(err)}); }
    }
  }catch(err){ log?.warn&&log.warn('Apply guild settings inner failed',{err:String(err)}); }
}
