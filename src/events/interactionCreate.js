import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const name = 'interactionCreate';
export async function execute(client, interaction) {
  try {
    if (interaction.isChatInputCommand && client.commands) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return await interaction.reply({ content: 'Command not found.', ephemeral: true });
      try {
        await cmd.execute(interaction);
      } catch (err) {
        console.error(`Error executing command ${interaction.commandName}:`, err);
        if (!interaction.replied) await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
      }
    }

    // Button interactions (simple router)
    if (interaction.isButton && interaction.customId) {
      const parts = interaction.customId.split(':');
      // Example customId: akinator_answer:<sessionId>:yes
      if (parts[0] === 'akinator_answer') {
        const sessionId = parts[1];
        const answer = parts[2];
        // delegate to akinator engine module
        try {
          const mod = await import(path.join(__dirname, '..', 'lib', 'akinatorEngine.js'));
          const engine = mod.default;
          const res = await engine.handleAnswer(interaction, sessionId, answer);
          // engine is responsible for updating the interaction
        } catch (err) {
          console.error('Akinator answer handler failed:', err);
          if (!interaction.replied) await interaction.reply({ content: 'Failed to handle answer.', ephemeral: true });
        }
      }

      // Consent buttons for roast/compliment: consent:<userId>
      if (parts[0] === 'consent') {
        const targetId = parts[1];
        if (interaction.user.id !== targetId) return await interaction.reply({ content: 'Only the targeted user may consent.', ephemeral: true });
        // Acknowledge consent — the initiating command should be listening for this reaction in its flow
        await interaction.update({ content: 'Consent received. Proceeding...', components: [] });
      }
    }
  } catch (err) {
    console.error('Error in interactionCreate event:', err);
  }
}
