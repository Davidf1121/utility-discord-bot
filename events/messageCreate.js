export default {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const { client } = message;
    
    // Check if auto-moderation manager exists
    if (client.autoModerationManager) {
      await client.autoModerationManager.handleMessage(message);
    }
  },
};
