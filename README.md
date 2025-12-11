# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/discopy [![npm version](https://img.shields.io/npm/v/@eliware/discopy.svg)](https://www.npmjs.com/package/@eliware/discopy)[![license](https://img.shields.io/github/license/eliware/discopy.svg)](LICENSE)[![build status](https://github.com/eliware/discopy/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/discopy/actions)

Discopy is a focused Discord server backup and restore utility built on top of the `@eliware/discord` framework. It provides commands and tooling to export a guild's configuration (roles, channels, permissions, emojis, stickers, events, invites, webhooks, etc.) into portable backups and to restore them into another guild. The project is ESM-first and designed to be run locally, as a systemd service, or inside Docker.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running as a Service (systemd)](#running-as-a-service-systemd)
- [Docker](#docker)
- [Architecture & Files](#architecture--files)
- [Customization](#customization)
- [Testing](#testing)
- [Support](#support)
- [License](#license)

## Features

- Backup and restore full guild configuration (roles, channels, categories, overwrites).
- Export emojis and stickers into backups and re-upload on restore.
- Recreate invites, webhooks, events, and bans during restore.
- CLI-style Discord commands: `backup`, `restore`, `reset`, and `help` for interactive use.
- Optional scheduled daily backups implemented in `events/clientReady.mjs` (default: 04:00 Eastern / 09:00 UTC).
- Localized command and response strings under `locales/`.
- Safe sequential processing to reduce rate-limit bursts when running backups/restores.

## Getting Started

1. **Clone this project:**

   ```bash
   git clone https://github.com/eliware/discopy.git
   cd discopy
   npm install
   ```

2. **Set up your environment:**
   - Copy `.env.example` to `.env` and fill in your Discord bot token and any other required values. Typical values you will provide include your `DISCORD_TOKEN` (bot token) and optional configuration such as backup paths or scheduling toggles. See `.env.example` for the exact variables used by the app.

3. **Start the app locally:**

   ```bash
   npm start
   # or
   node discopy.mjs
   ```

4. **Use the commands in Discord:**
   - `backup` — create and save a backup for the current guild (creates a ZIP under `backups/`).
   - `restore` — restore a previously created backup into the current guild.
   - `reset` — helper to apply default configuration to a guild.
   - `help` — list available commands and usage.

## Configuration

- All runtime configuration is loaded from the `.env` file via `dotenv`. Copy `.env.example` and populate secrets and optional flags.
- Scheduling: the bot contains a scheduler in `events/clientReady.mjs` that will optionally run daily backups at 09:00 UTC (04:00 EST). The code comments explain how to change time and DST behavior.

## Running as a Service (systemd)

1. Copy `discopy.service` to `/usr/lib/systemd/system/discopy.service`.
2. Edit the paths and user/group as needed (point `ExecStart` to the installation path of `discopy.mjs`).
3. Reload systemd and start the service:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable discopy
   sudo systemctl start discopy
   sudo systemctl status discopy
   ```

## Docker

1. Build the Docker image:

   ```bash
   docker build -t discopy .
   ```

2. Run the container (pass `.env` for configuration):

   ```bash
   docker run --env-file .env discopy
   ```

## Architecture & Files

- Command handlers: `commands/` — each command has a `.json` definition for Discord plus a `.mjs` runtime handler. Key commands: `backup`, `restore`, `reset`, `help`.
- Backup collectors: `src/backup/` — modules such as `collectGuild.mjs`, `collectEmojis.mjs`, and `saveZip.mjs` build and persist backup ZIPs.
- Restore helpers: `src/restore/` — many small, focused modules (e.g. `createRoles.mjs`, `createChannels.mjs`, `uploadEmojis.mjs`) re-create guild state from a backup archive.
- Reset flow: `src/reset/` — contains the logic to apply default settings and plans when resetting a guild.
- Event wiring: `events/clientReady.mjs` — sets presence, pre-fetches members (when `GUILD_MEMBERS` intent is enabled), and schedules daily backups.

## Customization

- Add or modify commands in the `commands/` directory; update the corresponding `.json` to change registration and localization.
- Event handlers live in `events/` and are auto-registered by the framework used in `discopy.mjs`.
- Localization files live in `locales/` — add languages or adjust translations used by command `.json` files and runtime responses.

## Testing

- Run the project's test suite with:

  ```bash
  npm test
  ```

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)[![eliware.org](https://eliware.org/logos/eliware_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

## License

[MIT © 2025 Eli Sterling, eliware.org](LICENSE)

## Links

- [Home Page](https://eliware.org)
- [GitHub Repo](https://github.com/eliware/discopy)
- [GitHub Org](https://github.com/eliware)
- [GitHub Personal](https://github.com/eli-sterling)
- [Discord](https://discord.gg/M6aTR9eTwN)
