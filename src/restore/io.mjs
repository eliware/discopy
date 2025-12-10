import fs from 'node:fs/promises';
import path from 'node:path';

export async function unpackBackup(tmpBase, filename, extractDir, log){
  await fs.mkdir(extractDir,{recursive:true});
  const filepath = path.join(tmpBase, filename);
  if(filename.endsWith('.zip')){
    // try system unzip
    try{
      const child = await import('node:child_process');
      const {promisify} = await import('node:util');
      const exec = promisify(child.exec);
      await exec(`unzip -o ${filepath} -d ${extractDir}`);
    }catch(err){
      log?.warn && log.warn('System unzip failed, attempting JS fallback', {err:String(err)});
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip(filepath);
      zip.extractAllTo(extractDir,true);
    }
    const raw = await fs.readFile(path.join(extractDir,'backup.json'),'utf8');
    return JSON.parse(raw);
  } else if(filename.endsWith('.json')){
    const raw = await fs.readFile(filepath,'utf8');
    return JSON.parse(raw);
  } else throw new Error('Unsupported backup type');
}
