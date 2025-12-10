// commands/backup.mjs
import collectGuild from '../src/backup/collectGuild.mjs';
import collectEmojis from '../src/backup/collectEmojis.mjs';
import collectStickers from '../src/backup/collectStickers.mjs';
import saveZip from '../src/backup/saveZip.mjs';
import { sleep } from '../src/backup/helpers.mjs';

export default async function ({ log, msg }, interaction) {
  log.debug('backup Request', { interaction });

  const steps = [
    'Guild settings',
    'Roles',
    'Channels & categories',
    'Permission overwrites',
    'Emojis (downloaded)',
    'Stickers (downloaded)',
    'Webhooks',
    'Scheduled events',
    'Invites',
    'Bans (metadata)',
    'Members (metadata)',
    'Save ZIP file'
  ];

  let content = steps.map(s => `- \u23f3 ${s}`).join('\n');
  await interaction.reply({ content });

  async function markNext() {
    content = content.replace('\u23f3', '\u2705');
    try { await interaction.editReply({ content }); } catch (err) { log.warn('Failed to edit reply', { err: String(err) }); }
  }

  const guild = interaction.guild || (interaction.client && interaction.client.guilds && interaction.client.guilds.cache && interaction.client.guilds.cache.get(interaction.guildId));
  const backup = { metadata: { createdAt: new Date().toISOString(), guildId: guild ? guild.id : interaction.guildId || null, collectedBy: (interaction.user && interaction.user.id) || null }, data: {} };

  const ts = Date.now();
  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  const tmpdir = `/opt/discopy/backups/backup-${backup.metadata.guildId || 'unknown'}-${ts}`;
  try { await fs.mkdir(tmpdir, { recursive: true }); await fs.mkdir(path.join(tmpdir, 'emojis'), { recursive: true }); await fs.mkdir(path.join(tmpdir, 'stickers'), { recursive: true }); } catch (err) { log.warn('Failed to create temp dirs', { err: String(err) }); }

  // Step 1: Guild settings
  try {
    backup.data.guild = await collectGuild(guild, tmpdir, log);
  } catch (err) { log.warn('Guild settings collection failed', { err: String(err) }); backup.data.guild = { error: String(err) }; }
  await markNext();

  // Step 2: Roles
  try {
    if (guild && guild.roles && guild.roles.cache) {
      backup.data.roles = guild.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor || r.color || null, hoist: r.hoist || false, permissions: r.permissions ? (r.permissions.bitfield !== undefined ? r.permissions.bitfield : r.permissions) : (r.permissions || null), position: r.position || null, mentionable: r.mentionable || false, managed: r.managed || false }));
    } else { backup.data.roles = []; }
  } catch (err) { log.warn('Roles collection failed', { err: String(err) }); backup.data.roles = { error: String(err) }; }
  await markNext();

  // Step 3: Channels & categories
  try {
    if (guild && guild.channels && guild.channels.cache) {
      backup.data.channels = guild.channels.cache.map(c => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId || (c.parent && c.parent.id) || null, position: c.position || null, topic: c.topic || null, nsfw: c.nsfw || false, bitrate: c.bitrate || null, userLimit: c.userLimit || null, rateLimitPerUser: c.rateLimitPerUser || null }));
    } else { backup.data.channels = []; }
  } catch (err) { log.warn('Channels collection failed', { err: String(err) }); backup.data.channels = { error: String(err) }; }
  await markNext();

  // Step 4: Permission overwrites
  try {
    if (Array.isArray(backup.data.channels)) {
      for (const ch of backup.data.channels) {
        try {
          const channel = guild.channels.cache.get(ch.id);
          if (!channel) { ch.permissionOverwrites = []; continue; }
          const manager = channel.permissionOverwrites;
          if (!manager) { ch.permissionOverwrites = []; continue; }
          let overwritesArr = [];
          if (manager.cache && typeof manager.cache.map === 'function') overwritesArr = manager.cache.map(o => o);
          else if (typeof manager.map === 'function') { try { overwritesArr = manager.map(o => o); } catch (e) {} }
          else if (Array.isArray(manager)) overwritesArr = manager;
          else { try { for (const o of manager) overwritesArr.push(o); } catch (e) {} }
          ch.permissionOverwrites = overwritesArr.map(o => ({ id: String(o.id), type: o.type, allow: o.allow ? (o.allow.bitfield !== undefined ? o.allow.bitfield : o.allow) : null, deny: o.deny ? (o.deny.bitfield !== undefined ? o.deny.bitfield : o.deny) : null }));
        } catch (e) { ch.permissionOverwrites = { error: String(e) }; }
      }
    }
  } catch (err) { log.warn('Permission overwrites collection failed', { err: String(err) }); }
  await markNext();

  // Step 5: Emojis (download images)
  try {
    backup.data.emojis = await collectEmojis(guild, tmpdir, log);
  } catch (err) { log.warn('Emojis collection failed', { err: String(err) }); backup.data.emojis = { error: String(err) }; }
  await markNext();

  // Step 6: Stickers (download if possible)
  try {
    backup.data.stickers = await collectStickers(guild, tmpdir, log);
  } catch (err) { log.warn('Stickers collection failed', { err: String(err) }); backup.data.stickers = { error: String(err) }; }
  await markNext();

  // Step 7: Webhooks
  try {
    if (guild && guild.fetchWebhooks) {
      try { const webhooks = await guild.fetchWebhooks(); backup.data.webhooks = webhooks.map(w => ({ id: w.id, name: w.name, channelId: w.channelId, url: w.url || null })); } catch (e) { backup.data.webhooks = { error: 'fetch failed: '+String(e) }; }
    } else backup.data.webhooks = [];
  } catch (err) { log.warn('Webhooks collection failed', { err: String(err) }); backup.data.webhooks = { error: String(err) }; }
  await markNext();

  // Step 8: Scheduled events
  try { backup.data.scheduledEvents = (guild && guild.scheduledEvents && guild.scheduledEvents.cache) ? guild.scheduledEvents.cache.map(ev => ({ id: ev.id, name: ev.name, scheduledStartTime: ev.scheduledStartAt || ev.scheduledStartTime || null, scheduledEndTime: ev.scheduledEndAt || ev.scheduledEndTime || null, entityType: ev.entityType || null, channelId: ev.channelId || null })) : []; } catch (err) { log.warn('Scheduled events failed', { err: String(err) }); backup.data.scheduledEvents = { error: String(err) }; }
  await markNext();

  // Step 9: Invites
  try { if (guild && guild.fetchInvites) { try { const invites = await guild.fetchInvites(); backup.data.invites = invites.map(i => ({ code: i.code, channelId: i.channelId, maxUses: i.maxUses, maxAge: i.maxAge, temporary: i.temporary })); } catch (e) { backup.data.invites = { error: 'fetch failed: '+String(e) }; } } else backup.data.invites = []; } catch (err) { log.warn('Invites failed', { err: String(err) }); backup.data.invites = { error: String(err) }; }
  await markNext();

  // Step 10: Bans metadata
  try { if (guild && guild.bans && guild.bans.fetch) { try { const bans = await guild.bans.fetch(); backup.data.bans = bans.map(b => ({ userId: b.user.id, reason: b.reason || null })); } catch (e) { backup.data.bans = { error: 'fetch failed: '+String(e) }; } } else backup.data.bans = []; } catch (err) { log.warn('Bans failed', { err: String(err) }); backup.data.bans = { error: String(err) }; }
  await markNext();

  // Step 11: Members metadata
  try { backup.data.members = (guild && guild.members && guild.members.cache) ? guild.members.cache.map(m => ({ id: m.id, user: { id: m.user?.id || null, username: m.user?.username || null }, nickname: m.nickname || null, roles: m.roles ? (m.roles.cache ? m.roles.cache.map(r => r.id) : (Array.isArray(m.roles) ? m.roles : [])) : [] })) : []; } catch (err) { log.warn('Members failed', { err: String(err) }); backup.data.members = { error: String(err) }; }
  await markNext();

  // Step 12: Save JSON and ZIP
  try {
    const saved = await saveZip(backup, tmpdir, ts, log);
    backup._saved = { path: saved.zipPath, filename: saved.zipName };
    await markNext();

    content += `\n\nBackup saved: ${saved.zipName}`;

    // attach zip to reply
    try { await interaction.editReply({ content, files: [{ attachment: backup._saved.path, name: backup._saved.filename }] }); }
    catch (err) {
      log.warn('editReply with file failed, attempting followUp', { err: String(err) });
      try { await interaction.followUp({ content: `Backup saved: ${backup._saved.filename}`, files: [{ attachment: backup._saved.path, name: backup._saved.filename }], ephemeral: false }); await interaction.editReply({ content }); } catch (err2) { log.error('Failed to send backup zip', { err: String(err2) }); try { await interaction.editReply({ content }); } catch (_) {} }
    }

  } catch (err) {
    log.error('Failed to save ZIP', { err: String(err) });
    await markNext();
    content += `\n\nBackup attempted but failed to save: ${String(err)}`;
    try { await interaction.editReply({ content }); } catch (_) {}
  }

  log.debug('backup Response', { saved: backup._saved || null });
  return backup._saved ? backup._saved.filename : null;
}
