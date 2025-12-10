import { unpackBackup } from '../src/restore/io.mjs';
import createRoles from '../src/restore/createRoles.mjs';
import createCategories from '../src/restore/createCategories.mjs';
import createChannels from '../src/restore/createChannels.mjs';
import applyOverwrites from '../src/restore/applyOverwrites.mjs';
import uploadEmojis from '../src/restore/uploadEmojis.mjs';
import uploadStickers from '../src/restore/uploadStickers.mjs';
import recreateWebhooks from '../src/restore/recreateWebhooks.mjs';
import recreateEvents from '../src/restore/recreateEvents.mjs';
import recreateInvites from '../src/restore/recreateInvites.mjs';
import recreateBans from '../src/restore/recreateBans.mjs';
import applyMemberRoles from '../src/restore/applyMemberRoles.mjs';
import applyGuildSettings from '../src/restore/applyGuildSettings.mjs';
import summarizeIntegrations from '../src/restore/summarizeIntegrations.mjs';

export default async function ({ log, msg }, interaction) {
  log.debug('restore Request', { interaction });
  const steps = ['Unpack backup','Create roles','Create categories','Create channels','Apply permission overwrites','Upload emojis','Upload stickers','Recreate webhooks','Recreate scheduled events','Recreate invites','Recreate bans','Apply member roles','Apply guild settings','Finalize'];
  let content = steps.map(s=>`- \u23f3 ${s}`).join('\n');
  await interaction.reply({ content });
  async function markNext(){ content = content.replace('\u23f3','\u2705'); try{ await interaction.editReply({ content }); }catch(e){ log?.warn&&log.warn('editReply failed',{err:String(e)}); } }

  const guild = interaction.guild || (interaction.client && interaction.client.guilds && interaction.client.guilds.cache && interaction.client.guilds.cache.get(interaction.guildId));
  if(!guild){ await interaction.editReply({ content:'This command must be used in a guild.'}); return null; }

  const filename = (interaction.options && interaction.options.getString && interaction.options.getString('filename')) || (interaction.data && interaction.data.options && interaction.data.options[0] && interaction.data.options[0].value) || null;
  if(!filename){ await interaction.editReply({ content:'No filename provided.'}); return null; }

  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  const tmpBase = '/opt/discopy/backups';
  const filepath = `${tmpBase}/${filename}`;
  const ts = Date.now();
  const extractDir = `${tmpBase}/restore-${guild.id}-${ts}`;

  let backup;
  try{ backup = await unpackBackup(tmpBase, filename, extractDir, log); }catch(err){ log?.error&&log.error('Unpack failed',{err:String(err)}); await interaction.editReply({ content:`Unpack failed: ${String(err)}`}); return null; }
  // adapt _metadata for role creator
  backup._metadata = backup._metadata||backup.metadata||{};
  await markNext();

  const maps = { roles:{}, channels:{}, categories:{}, emojis:{}, stickers:{} };

  // roles
  await createRoles(backup, guild, maps, log);
  await markNext();

  // categories
  await createCategories(Array.isArray(backup.data.channels)?backup.data.channels:[], guild, maps, log);
  await markNext();

  // channels
  await createChannels(Array.isArray(backup.data.channels)?backup.data.channels:[], guild, maps, log);
  await markNext();

  // overwrites
  await applyOverwrites(Array.isArray(backup.data.channels)?backup.data.channels:[], guild, maps, backup._metadata, log);
  await markNext();

  // emojis
  await uploadEmojis(Array.isArray(backup.data.emojis)?backup.data.emojis:[], guild, extractDir, maps, log);
  await markNext();

  // stickers
  await uploadStickers(Array.isArray(backup.data.stickers)?backup.data.stickers:[], guild, extractDir, maps, log);
  await markNext();

  // webhooks
  await recreateWebhooks(Array.isArray(backup.data.webhooks)?backup.data.webhooks:[], guild, maps, log);
  await markNext();

  // events
  await recreateEvents(Array.isArray(backup.data.scheduledEvents)?backup.data.scheduledEvents:[], guild, maps, log);
  await markNext();

  // invites
  await recreateInvites(Array.isArray(backup.data.invites)?backup.data.invites:[], guild, maps, log);
  await markNext();

  // bans
  await recreateBans(Array.isArray(backup.data.bans)?backup.data.bans:[], guild, maps, log);
  await markNext();

  // member roles
  await applyMemberRoles(Array.isArray(backup.data.members)?backup.data.members:[], guild, maps, log);
  await markNext();

  // apply guild settings
  await applyGuildSettings(backup.data.guild||{}, guild, maps, extractDir, log);
  await markNext();

  // finalize
  try{ log?.info&&log.info('Restore finished.'); }catch(e){}
  await markNext();

  try{ await interaction.followUp({ content:`Restore attempted from ${filename}. Check logs for details.`, ephemeral:false }); }catch(e){}

  // summary integrations
  try{
    const note = summarizeIntegrations(backup.data || {});
    await interaction.followUp({ content: note, ephemeral:false });
  }catch(e){ log?.warn&&log.warn('Failed to send integrations note',{err:String(e)}); }

  try{ await fs.rm(extractDir,{recursive:true,force:true}); }catch(e){}
  return filename;
}
