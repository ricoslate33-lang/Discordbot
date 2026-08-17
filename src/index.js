import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import logger from './lib/logger.js';

// Ensure required env
const REQUIRED = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'GEMINI_API_KEY'];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.warn(`[WARN] Missing env var ${k} - some features may fail until it's set.`);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// Load commands (declarative command files under src/commands)
// This loader expects each command module to export { data, execute }
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const categories = fs.readdirSync(commandsPath, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const cat of categories) {
    const dir = path.join(commandsPath, cat.name);
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
      const full = path.join(dir, file);
      import(full).then(mod => {
        if (mod && mod.data && mod.execute) {
          client.commands.set(mod.data.name, mod);
          logger.info(`Loaded command ${mod.data.name} from ${cat.name}/${file}`);
        } else {
          logger.warn(`Skipping ${file} — missing data/execute export`);
        }
      }).catch(err => logger.error(`Failed to import command ${full}: ${err}`));
    }
  }
} else {
  logger.warn('No commands directory found yet — create src/commands/* to register commands.');
}

// Load event handlers from src/events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    const full = path.join(eventsPath, file);
    import(full).then(mod => {
      if (mod && typeof mod.execute === 'function') {
        if (mod.once) client.once(mod.name, (...args) => mod.execute(client, ...args));
        else client.on(mod.name, (...args) => mod.execute(client, ...args));
        logger.info(`Registered event handler: ${mod.name} (${file})`);
      } else {
        logger.warn(`Event file ${file} does not export { name, execute, once? }`);
      }
    }).catch(err => logger.error(`Failed to import event ${full}: ${err}`));
  }
} else {
  logger.warn('No events directory found yet — create src/events/* to handle events.');
}

// Basic health logging
client.once('ready', () => {
  logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);
  if (process.env.BOT_OWNER_ID) {
    const owner = client.users.cache.get(process.env.BOT_OWNER_ID);
    if (owner) logger.info(`Bot owner (cached): ${owner.tag}`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, destroying client...');
  await client.destroy();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, destroying client...');
  await client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start
client.login(process.env.DISCORD_TOKEN).catch(err => {
  logger.error('Failed to log in:', err);
});

export default client;
