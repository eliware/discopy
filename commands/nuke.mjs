import plan from '../src/nuke/plan.mjs';
import execute from '../src/nuke/execute.mjs';
import createDefaults from '../src/nuke/createDefaults.mjs';

export default async function ({ log, msg }, interaction){
  log.debug('nuke Request', { interaction });

  // permission guard
  const isAdmin = (()=>{ try{ if(interaction.member?.permissions) return interaction.member.permissions.has('ADMINISTRATOR'); if(interaction.memberPermissions) return interaction.memberPermissions.has('ADMINISTRATOR'); }catch(e){} return false; })();
  if(!isAdmin){ return interaction.reply({ content: 'You must have Administrator permission to run /nuke.', flags: 1<<6 }); }

  const dryRun = (interaction.options && interaction.options.getBoolean && typeof interaction.options.getBoolean('dry_run')==='boolean') ? interaction.options.getBoolean('dry_run') : ((interaction.data && interaction.data.options && interaction.data.options.find(o=>o.name==='dry_run')) ? !!interaction.data.options.find(o=>o.name==='dry_run').value : true);

  const steps = ['Plan','Delete content','Apply guild defaults','Create defaults','Finalize'];
  let content = steps.map(s=>`- \u23f3 ${s}`).join('\n');
  await interaction.reply({ content });
  async function markNext(){ content = content.replace('\u23f3','\u2705'); try{ await interaction.editReply({ content }); }catch(e){ log?.warn&&log.warn('editReply failed',{err:String(e)}) } }

  const guild = interaction.guild || (interaction.client && interaction.client.guilds && interaction.client.guilds.cache && interaction.client.guilds.cache.get(interaction.guildId));
  if(!guild){ await interaction.editReply({ content: 'This command must be used in a guild.' }); return null; }

  // Step 1: Plan
  const p = await plan(guild, log);
  await markNext();

  // show plan summary
  try{ await interaction.editReply({ content: content + `\n\nPlanned deletions: roles=${p.roles.length}, channels=${p.channels.length}, emojis=${p.emojis.length}, stickers=${p.stickers.length}\nDry run: ${dryRun}` }); }catch(e){}

  // Step 2: Execute deletions
  const results = await execute(p, guild, dryRun, log);
  await markNext();

  // Step 3: Apply guild defaults (name/icon)
  const guildDefaultsResult = { nameChanged: false, iconRemoved: false, error: null };
  try{
    if(dryRun){ log?.info&&log.info('DRY RUN: would set guild name to "default server" and remove icon'); }
    else{
      try{
        await guild.setName('default server', 'nuke: reset name');
        guildDefaultsResult.nameChanged = true;
      }catch(err){ guildDefaultsResult.error = guildDefaultsResult.error || []; guildDefaultsResult.error.push({ action: 'setName', err: String(err) }); log?.warn&&log.warn('Failed to set guild name',{err:String(err)}); }
      try{
        // remove icon
        await guild.setIcon(null, 'nuke: remove icon');
        guildDefaultsResult.iconRemoved = true;
      }catch(err){ guildDefaultsResult.error = guildDefaultsResult.error || []; guildDefaultsResult.error.push({ action: 'removeIcon', err: String(err) }); log?.warn&&log.warn('Failed to remove guild icon',{err:String(err)}); }
    }
  }catch(err){ guildDefaultsResult.error = guildDefaultsResult.error || []; guildDefaultsResult.error.push({ action: 'applyGuildDefaults', err: String(err) }); log?.warn&&log.warn('Apply guild defaults failed',{err:String(err)}); }
  await markNext();

  // Step 4: Create defaults
  const created = await createDefaults(guild, {}, dryRun, log);
  await markNext();

  // Step 5: Finalize
  try{ await interaction.followUp({ content: `Nuke ${dryRun? 'dry-run completed' : 'completed'}. Results: ${JSON.stringify(results)}. Guild defaults: ${JSON.stringify(guildDefaultsResult)}. Defaults created: ${JSON.stringify(created)}`, ephemeral: false }); }catch(e){}

  return { plan: p, results, guildDefaultsResult, created };
}
