# Discordbot (Discord.js v14) — Multi-feature AI bot

This repository provides a modular Discord bot built with discord.js v14, using Google Gemini (via @google/generative-ai) for AI features, and better-sqlite3 for lightweight persistence.

Features (planned / in progress)
- AI chat with per-user, per-channel memory and persona system
- Akinator-style dynamic guessing game powered by Gemini
- Fun commands: 8ball, would-you-rather, meme, poll, roast/compliment
- Moderation: warn, warnings, kick, ban, mute (timeout), purge
- Auto-moderation hooks (spam, invite filter, profanity detection with Gemini)

Requirements
- Node.js 20+
- A Discord bot application and token
- Gemini API key from Google AI Studio

Environment (.env)
- DISCORD_TOKEN=your_discord_bot_token
- DISCORD_CLIENT_ID=your_bot_client_id
- GEMINI_API_KEY=your_gemini_api_key
- MOD_LOG_CHANNEL_ID=optional channel id for moderation logs
- BOT_OWNER_ID=optional owner id for owner-only commands

Quick start
1. Copy .env.example to .env and set values.
2. npm install
3. npm run deploy   # registers slash commands globally
4. npm start

Development notes
- Commands should be added under src/commands in subfolders. Each command module must export `data` (a SlashCommandBuilder instance) and `execute(interaction)`.
- Event handlers go under src/events and must export `{ name, execute, once? }`.
- Database file is created at src/data/bot.sqlite on first run.
- Gemini wrapper is at src/lib/gemini.js. Swap models by passing options.model = 'gemini-1.5-pro' to generateReply.

Deploy targets
- Railway / Render: Use npm start; make sure to set the environment variables in the project settings.
- VPS / pm2: Use `pm2 start npm --name discordbot -- start` or configure a systemd service.

Next steps
- Implement command and event modules (I will add them in subsequent commits: deploy-commands, events, AI commands, akinator engine, automod logic, and moderation commands).

