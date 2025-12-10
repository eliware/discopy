export function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
export async function getFetch(){if(typeof globalThis.fetch==='function')return globalThis.fetch;try{const nf=await import('node-fetch');return nf.default}catch(e){throw new Error('No fetch available (install node-fetch or run on Node v18+)');}}
