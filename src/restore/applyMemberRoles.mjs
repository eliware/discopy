export default async function applyMemberRoles(members, guild, maps, log){
  for(const m of members){
    try{ if(!m.id||!m.roles||!Array.isArray(m.roles)) continue; const member = await guild.members.fetch(m.id).catch(()=>null); if(!member) continue; const addRoles = m.roles.map(rid=>maps.roles[rid]).filter(Boolean); if(addRoles.length){ try{ await member.roles.add(addRoles,'restored'); }catch(err){ log?.warn&&log.warn('Failed to add roles to member',{member:m.id,err:String(err)}); } } }catch(err){ log?.warn&&log.warn('Member roles inner failed',{err:String(err)}); }
    await new Promise(r=>setTimeout(r,50));
  }
}
