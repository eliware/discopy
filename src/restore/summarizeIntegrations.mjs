export default function summarizeIntegrations(backup){
  const managed = Array.isArray(backup.roles)?backup.roles.filter(r=>r.managed):[];
  const managedList = managed.map(r=>`${r.name} (role id: ${r.id})`);
  const webhooks = Array.isArray(backup.webhooks)?backup.webhooks.map(w=>`${w.name} (channel: ${w.channelId})`):[];
  let note='';
  if(managedList.length){ note+='**Managed roles / possible bots & integrations that could not be recreated:**\n'; note+=managedList.join('\n')+'\n\n'; }
  if(webhooks.length){ note+='**Webhooks found in backup (recreated where possible):**\n'; note+=webhooks.join('\n')+'\n\n'; }
  if(!note) note='No managed roles or webhooks detected in the backup.';
  return note;
}
