// saveZip.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

export default async function saveZip(backup, tmpdir, ts, log) {
  const jsonPath = path.join(tmpdir, 'backup.json');
  const jsonText = JSON.stringify(backup, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
  await fs.writeFile(jsonPath, jsonText, 'utf8');

  const zipName = `${backup.metadata.guildId || 'unknown'}-${ts}.zip`;
  const zipPath = `/opt/discopy/backups/${zipName}`;

  // try system zip
  try {
    const child = await import('node:child_process');
    const { promisify } = await import('node:util');
    const exec = promisify(child.exec);
    const cmd = `cd ${tmpdir} && zip -r -X ${zipPath} .`;
    await exec(cmd);
    return { zipPath, zipName };
  } catch (err) {
    log?.warn && log.warn('System zip failed, attempting JS fallback', { err: String(err) });
    try {
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      async function addDirRecursive(dir, base) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          const rel = path.join(base, ent.name);
          if (ent.isDirectory()) {
            await addDirRecursive(full, rel);
          } else {
            zip.addLocalFile(full, path.dirname(rel), path.basename(rel));
          }
        }
      }
      await addDirRecursive(tmpdir, '');
      zip.writeZip(zipPath);
      return { zipPath, zipName };
    } catch (err2) {
      log?.error && log.error('Failed to create zip (no system zip and no adm-zip)', { err: String(err2) });
      throw err2;
    }
  }
}
