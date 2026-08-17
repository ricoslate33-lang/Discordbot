import { SlashCommandBuilder } from 'discord.js';
import db from '../../lib/db.js';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('List a user\'s warnings')
  .addUserOption(o => o.setName('user').setDescription('User to view').setRequired(true));

export async function execute(interaction) {
  const user = interaction.options.getUser('user', true);
  const rows = db.prepare('SELECT id, moderatorId, reason, created_at FROM warnings WHERE userId = ? AND guildId = ? ORDER BY created_at DESC').all(user.id, interaction.guildId);
  if (!rows || !rows.length) return interaction.reply({ content: `No warnings for ${user.tag}.`, ephemeral: true });
  const lines = rows.map(r => `• #${r.id} by <@${r.moderatorId}> at ${new Date(r.created_at*1000).toLocaleString()}: ${r.reason}`);
  await interaction.reply({ content: `Warnings for ${user.tag}:\n` + lines.join('\n'), ephemeral: true });
}

export default { data, execute };
