#!/usr/bin/env node
import 'dotenv/config';
//import { createDb } from '@eliware/mysql';
import { createDiscord } from '@eliware/discord';
import { log, fs, path, registerHandlers, registerSignals } from '@eliware/common';

registerHandlers({ log });
registerSignals({ log });

const packageJson = JSON.parse(fs.readFileSync(path(import.meta, 'package.json')), 'utf8');
const version = packageJson.version;

const presence = { activities: [{ name: `discopy v${version}`, type: 4 }], status: 'online' };

//const db = await createDb({ log });
//registerSignals({ shutdownHook: () => db.end() });
const client = await createDiscord({
    log,
    rootDir: path(import.meta),
    context: {
        //db,
        presence,
        version
    },
    intents: {
        Guilds: true,
        GuildMessages: true,
        MessageContent: false,
        GuildMembers: false,
        GuildPresences: false,
        GuildVoiceStates: false,
    }
});
registerSignals({ shutdownHook: () => client.destroy() });
