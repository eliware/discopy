// collectEmojis.mjs
import { extractExtFromUrl, downloadTo, getFetch } from './helpers.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

export default async function collectEmojis(guild, tmpdir, log) {
  const results = [];
  try {
    const fetchFn = await getFetch();
    if (!guild || !guild.emojis || !guild.emojis.cache) return results;
    for (const e of guild.emojis.cache.values()) {
      try {
        let url = null;
        try { if (typeof e.imageURL === 'function') { url = e.imageURL({ size: 1024, dynamic: !!e.animated }); } } catch (_) { url = null; }
        if (!url) url = e.animated ? `https://cdn.discordapp.com/emojis/${e.id}.gif` : `https://cdn.discordapp.com/emojis/${e.id}.png`;
        const ext = extractExtFromUrl(url, e.animated ? 'gif' : 'png');
        const filename = `${e.id}_${(e.name||'emoji').replace(/[^a-z0-9_-]/ig,'')}.${ext}`;
        const dest = path.join(tmpdir, 'emojis', filename);
        const saved = await downloadTo(url, dest, fetchFn);
        results.push({ id: e.id, name: e.name, animated: e.animated || false, roles: e.roles ? (e.roles.cache ? e.roles.cache.map(r=>r.id) : []) : [], url, file: saved ? `emojis/${filename}` : null });
      } catch (err) { log?.warn && log.warn('Emoji collect failed', { err: String(err) }); }
    }
  } catch (err) { log?.warn && log.warn('Emojis collection failed', { err: String(err) }); }
  return results;
}
