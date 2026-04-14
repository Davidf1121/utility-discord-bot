import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createLogger } from '../utils/Logger.js';

const logger = createLogger('TicketButton');

export default {
  customId: 'create_ticket',
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('create_ticket_modal')
      .setTitle('Open Support Ticket');

    const titleInput = new TextInputBuilder()
      .setCustomId('ticket_title')
      .setLabel('Ticket Subject')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Reason for opening this ticket')
      .setMinLength(5)
      .setMaxLength(100)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('ticket_description')
      .setLabel('Detailed Description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Please provide as much detail as possible...')
      .setMinLength(10)
      .setMaxLength(1000)
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

    modal.addComponents(firstActionRow, secondActionRow);

    try {
      await interaction.showModal(modal);
      logger.debug(`Showed ticket creation modal to user ${interaction.user.id}`);
    } catch (error) {
      logger.error('Error showing modal:', error);
      await interaction.reply({
        content: 'Failed to open the ticket form. Please try again.',
        ephemeral: true
      });
    }
  }
};
