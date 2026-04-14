import { createLogger } from '../utils/Logger.js';

const logger = createLogger('CloseTicketButton');

export default {
  customId: 'close_ticket',
  async execute(interaction) {
    const isTicket = interaction.client.ticketManager.isTicketChannel(interaction.channel.id);
    const isTicketName = interaction.channel.name.startsWith('ticket-');

    if (!isTicket && !isTicketName) {
      return interaction.reply({
        content: 'This button can only be used in a ticket channel.',
        ephemeral: true
      });
    }

    try {
      await interaction.reply('Closing ticket...');
      await interaction.client.ticketManager.closeTicket(interaction.channel, interaction.user);
    } catch (error) {
      logger.error('Error closing ticket via button:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('Failed to close ticket. An error occurred.');
      } else {
        await interaction.reply({ content: 'Failed to close ticket. An error occurred.', ephemeral: true });
      }
    }
  }
};
