export const name = 'ready';
export const once = true;

export async function execute(client) {
  try {
    console.log(`Ready! Logged in as ${client.user.tag} (${client.user.id})`);
    // Set activity
    client.user.setPresence({ activities: [{ name: '/chat | AI & Games' }], status: 'online' }).catch(() => {});
  } catch (err) {
    console.error('Error in ready event:', err);
  }
}
