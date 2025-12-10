export default async function createCategories(channels, guild, maps, log){
  const categories = channels.filter(c=>c.type===4||c.type==='GUILD_CATEGORY'||c.type==='category');
  for(const cat of categories.sort((a,b)=>(a.position||0)-(b.position||0))){
    try{
      const created = await guild.channels.create(cat.name||'category',{ type: 4, reason: 'restored' }).catch(async e=>{ try{ return await guild.channels.create({ name: cat.name||'category', type:4 }); }catch(e2){ throw e2; } });
      if(created && created.id) maps.categories[cat.id]=created.id;
    }catch(err){ log?.warn&&log.warn('Category create failed',{name:cat.name,err:String(err)}); }
    await new Promise(r=>setTimeout(r,200));
  }
}
