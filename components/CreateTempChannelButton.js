import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createLogger } from '../utils/Logger.js';

const logger = createLogger('CreateTempChannelButton');

export default {
  customId: 'create_temp_channel',
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('create_temp_channel_modal')
      .setTitle('Create Temporary Voice Channel');

    const channelNameInput = new TextInputBuilder()
      .setCustomId('channel_name')
      .setLabel('Channel Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('My Awesome Channel')
      .setMinLength(2)
      .setMaxLength(100)
      .setValue(`${interaction.user.username}'s Channel`)
      .setRequired(true);

    const userLimitInput = new TextInputBuilder()
      .setCustomId('user_limit')
      .setLabel('User Limit (0 for unlimited)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('10')
      .setValue('10')
      .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(channelNameInput);
    const secondActionRow = new ActionRowBuilder().addComponents(userLimitInput);

    modal.addComponents(firstActionRow, secondActionRow);

    try {
      await interaction.showModal(modal);
      logger.debug(`Showed create temp channel modal to user ${interaction.user.id}`);
    } catch (error) {
      logger.error('Error showing modal:', error);
      await interaction.reply({
        content: 'Failed to open the channel creation form. Please try again.',
        ephemeral: true
      });
    }
  }
};
