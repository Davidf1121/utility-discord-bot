import { createLogger } from '../utils/Logger.js';
import { EmbedBuilder } from 'discord.js';

const logger = createLogger('TicketModal');

export default {
  customId: 'create_ticket_modal',
  async execute(interaction) {
    const ticketManager = interaction.client.ticketManager;
    const config = ticketManager.config;
    
    const title = interaction.fields.getTextInputValue('ticket_title');
    const description = interaction.fields.getTextInputValue('ticket_description');

    try {
      await interaction.deferReply({ ephemeral: true });

      const channel = await ticketManager.createTicketChannel(
        interaction.guild,
        interaction.user,
        title,
        description
      );

      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(config.embedColors.success)
          .setTitle('✅ Ticket Created')
          .setDescription(`Your ticket has been created: <#${channel.id}>`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        if (config.controlChannelId) {
          const controlChannel = interaction.client.channels.cache.get(config.controlChannelId);
          if (controlChannel && controlChannel.isTextBased()) {
            await controlChannel.send({
              content: `<@${interaction.user.id}> opened a new ticket: <#${channel.id}>`
            }).catch(err => logger.debug('Could not send to control channel:', err));
          }
        }
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor(config.embedColors.error)
          .setTitle('❌ Failed to Create Ticket')
          .setDescription('Could not create the ticket channel. Please check the bot permissions and configuration.')
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    } catch (error) {
      logger.error('Error creating ticket from modal:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(config.embedColors.error)
        .setTitle('❌ Error')
        .setDescription(`An error occurred: ${error.message}`)
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
