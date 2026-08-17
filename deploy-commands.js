import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';

// This script scans src/commands/* for modules exporting { data }
// and registers them as global commands. For development you may
// want to register per-guild by setting GUILD_ID in env and
// uncommenting the guild registration path.

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
if (!TOKEN || !CLIENT_ID) {
  console.error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required in .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(process.cwd(), 'src', 'commands');
if (!fs.existsSync(commandsPath)) {
  console.error('No src/commands directory found — create command files before running deploy.');
  process.exit(1);
}

function walkCommands(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCommands(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) {
      try {
        const mod = require(full);
        if (mod && mod.data) {
          const json = mod.data.toJSON ? mod.data.toJSON() : mod.data;
          commands.push(json);
        }
      } catch (err) {
        // dynamic import with ESM is trickier in node scripts; attempt eval via createRequire
        console.warn(`Skipping ${full}: ${err.message}`);
      }
    }
  }
}

walkCommands(commandsPath);

if (!commands.length) {
  console.warn('No commands found to register.');
  process.exit(0);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} commands globally...`);
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );
    console.log('Commands registered globally.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
})();
