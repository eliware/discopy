export function sleep(ms){return new Promise(res=>setTimeout(res,ms));}
export function safeName(name){ try{ if(typeof name!=='string') return 'unnamed'; return name.trim().slice(0,100); }catch(e){return 'unnamed'; }}
