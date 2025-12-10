// collectStickers.mjs
import { extractExtFromUrl, downloadTo, getFetch } from './helpers.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

export default async function collectStickers(guild, tmpdir, log) {
  const results = [];
  try {
    const fetchFn = await getFetch();
    if (!guild || !guild.stickers || !guild.stickers.cache) return results;
    for (const s of guild.stickers.cache.values()) {
      try {
        let url = s.url || (typeof s.url === 'function' ? s.url() : null) || `https://media.discordapp.net/stickers/${s.id}.png`;
        const ext = extractExtFromUrl(url, 'png');
        const filename = `${s.id}_${(s.name||'sticker').replace(/[^a-z0-9_-]/ig,'')}.${ext}`;
        const dest = path.join(tmpdir, 'stickers', filename);
        const saved = await downloadTo(url, dest, fetchFn);
        results.push({ id: s.id, name: s.name, description: s.description, tags: s.tags, file: saved ? `stickers/${filename}` : null, url: saved ? url : null });
      } catch (err) { log?.warn && log.warn('Sticker collect failed', { err: String(err) }); }
    }
  } catch (err) { log?.warn && log.warn('Stickers collection failed', { err: String(err) }); }
  return results;
}
