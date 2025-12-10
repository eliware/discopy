// helpers.mjs
export function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

export async function getFetch() {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  try { const nf = await import('node-fetch'); return nf.default; } catch (e) { throw new Error('No fetch available (install node-fetch or run on Node v18+)'); }
}

export function extractExtFromUrl(u, fallback) {
  try {
    const p = new URL(u).pathname;
    const m = p.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
    if (m && m[1]) return m[1];
  } catch (e) {}
  return fallback || 'png';
}

export async function downloadTo(url, destPath, fetchFn) {
  try {
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    const fs = await import('node:fs/promises');
    await fs.writeFile(destPath, buf);
    return true;
  } catch (err) {
    // don't throw — return false so caller can continue
    return false;
  }
}
