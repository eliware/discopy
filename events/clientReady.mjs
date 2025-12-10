// events/clientReady.mjs
export default async function ({ log, presence }, client) {
    log.debug('ready', { tag: client.user.tag });
    log.info(`Logged in as ${client.user.tag}`);
    if (presence) client.user.setPresence(presence);

    // Re-apply presence every 8 hours
    try {
        const eightHours = 8 * 60 * 60 * 1000;
        setInterval(() => {
            try {
                if (presence) {
                    client.user.setPresence(presence);
                    log.info('Re-applied presence from saved configuration');
                }
            } catch (err) {
                log.warn('Failed to re-apply presence', err?.message);
            }
        }, eightHours);
    } catch (err) {
        log.error('Error setting presence re-apply interval', err);
    }

    // Fetch all guild members on startup (requires GUILD_MEMBERS intent)
    try {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                log.info(`Fetching members for guild ${guildId} (${guild.name})`);
                await guild.members.fetch();
                log.info(`Fetched members for guild ${guildId} (${guild.members.cache.size} cached)`);
            } catch (err) {
                log.warn(`Failed to fetch members for guild ${guildId}: ${err?.message}`);
            }
        }
    } catch (err) {
        log.error('Error while fetching guild members on ready', err);
    }

    // Daily backup scheduler
    // User requested daily backups at 4:00 AM Eastern (EST). That's 09:00 UTC.
    // Note: this schedules at fixed 09:00 UTC every day. If you want DST-aware behavior (4AM local wall time), let me know.
    try {
        const targetUtcHour = 9; // 09:00 UTC == 04:00 EST

        function msUntilNextUtcHour(hourUtc) {
            const now = new Date();
            const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc, 0, 0, 0));
            if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
            return next.getTime() - now.getTime();
        }

        async function runDailyBackups() {
            try {
                log.info('Starting scheduled daily backups for all guilds');
                const backupModulePath = 'file:///opt/discopy/commands/backup.mjs';
                let backupModule;
                try {
                    backupModule = await import(backupModulePath);
                } catch (err) {
                    log.error('Failed to import backup module for scheduled backups', { err: String(err) });
                    return;
                }

                // run backups sequentially to avoid burst rate limits
                for (const [guildId, guild] of client.guilds.cache) {
                    try {
                        log.info('Running backup for guild', { guildId, name: guild.name });

                        // create a minimal fake interaction object the backup handler expects
                        const fakeInteraction = {
                            guild,
                            guildId: guild.id,
                            user: { id: '0' },
                            client,
                            // reply/editReply/followUp are used by the command to show progress; stub to log only
                            reply: async (payload) => { log.info('scheduled-backup: reply', { guildId, payload: payload && payload.content ? payload.content.toString().slice(0,200) : null }); return; },
                            editReply: async (payload) => { log.info('scheduled-backup: editReply', { guildId, payload: payload && payload.content ? payload.content.toString().slice(0,200) : null }); return; },
                            followUp: async (payload) => { log.info('scheduled-backup: followUp', { guildId, payload: payload && payload.content ? payload.content.toString().slice(0,200) : null }); return; }
                        };

                        try {
                            const saved = await backupModule.default({ log, msg: (k, v) => v }, fakeInteraction);
                            log.info('Scheduled backup completed', { guildId, saved });
                        } catch (err) {
                            log.warn('Scheduled backup failed for guild', { guildId, err: String(err) });
                        }

                        // small delay between guild backups
                        await new Promise(r => setTimeout(r, 2000));
                    } catch (err) {
                        log.warn('Error during scheduled backup loop for a guild', { err: String(err) });
                    }
                }

                log.info('Scheduled daily backups finished');
            } catch (err) {
                log.error('Unexpected error running scheduled daily backups', { err: String(err) });
            }
        }

        const initialDelay = msUntilNextUtcHour(targetUtcHour);
        log.info(`Scheduled daily backups at ${String(targetUtcHour).padStart(2,'0')}:00 UTC; first run in ${initialDelay}ms`);
        setTimeout(() => {
            // run immediately at the scheduled time, then every 24 hours
            runDailyBackups().catch(err => log.warn('Daily backups run failed', { err: String(err) }));
            setInterval(() => runDailyBackups().catch(err => log.warn('Daily backups run failed', { err: String(err) })), 24 * 60 * 60 * 1000);
        }, initialDelay);
    } catch (err) {
        log.error('Failed to schedule daily backups', { err: String(err) });
    }
}
