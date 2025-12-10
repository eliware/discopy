// collectGuild.mjs
import { extractExtFromUrl, downloadTo, getFetch } from './helpers.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

export default async function collectGuild(guild, tmpdir, log) {
  const gdata = {};
  try {
    gdata.id = guild.id;
    gdata.name = guild.name;
    gdata.iconURL = typeof guild.iconURL === 'function' ? guild.iconURL({ dynamic: true, size: 1024 }) : (guild.iconURL || null);
    gdata.splash = guild.splash || null;
    gdata.description = guild.description || null;
    gdata.preferredLocale = guild.preferredLocale || null;
    gdata.verificationLevel = guild.verificationLevel || null;
    gdata.explicitContentFilter = guild.explicitContentFilter || null;
    gdata.afkChannelId = guild.afkChannelId || null;
    gdata.afkTimeout = guild.afkTimeout || null;

    // download icon if present
    try {
      const fetchFn = await getFetch();
      const iconUrl = gdata.iconURL;
      if (iconUrl) {
        const ext = extractExtFromUrl(iconUrl, 'png');
        const filename = `icon.${ext}`;
        const dest = path.join(tmpdir, filename);
        const saved = await downloadTo(iconUrl, dest, fetchFn);
        if (saved) gdata.file = filename;
      }
    } catch (err) {
      log?.warn && log.warn('Guild icon download failed', { err: String(err) });
    }
  } catch (err) {
    return { error: String(err) };
  }
  return gdata;
}
