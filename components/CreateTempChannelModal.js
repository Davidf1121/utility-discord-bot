import { createLogger } from '../utils/Logger.js';
import { EmbedBuilder } from 'discord.js';

const logger = createLogger('CreateTempChannelModal');

export default {
  customId: 'create_temp_channel_modal',
  async execute(interaction) {
    const tempChannelManager = interaction.client.tempChannelManager;
    const config = tempChannelManager.config;
    
    const channelName = interaction.fields.getTextInputValue('channel_name');
    const userLimitInput = interaction.fields.getTextInputValue('user_limit');
    
    let userLimit = config.tempChannelSettings.defaultUserLimit;
    if (userLimitInput) {
      const parsed = parseInt(userLimitInput, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        userLimit = parsed === 0 ? 0 : parsed;
      }
    }

    const options = {
      name: channelName,
      userLimit,
      categoryId: config.voiceCategoryId
    };

    try {
      await interaction.deferReply({ ephemeral: true });

      const channel = await tempChannelManager.createTempChannel(
        interaction.guild,
        interaction.user.id,
        options
      );

      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(config.embedColors.success)
          .setTitle('✅ Temporary Voice Channel Created')
          .setDescription(`Successfully created **${channel.name}**`)
          .addFields(
            { name: 'Channel ID', value: channel.id, inline: true },
            { name: 'User Limit', value: userLimit === 0 ? 'Unlimited' : userLimit.toString(), inline: true },
            { name: 'Owner', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'This channel will be deleted when empty' });

        await interaction.editReply({ embeds: [embed] });

        if (config.controlChannelId) {
          const controlChannel = interaction.client.channels.cache.get(config.controlChannelId);
          if (controlChannel && controlChannel.isTextBased()) {
            await controlChannel.send({
              content: `<@${interaction.user.id}> created a new temporary voice channel: <#${channel.id}>`
            }).catch(err => logger.debug('Could not send to control channel:', err));
          }
        }
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor(config.embedColors.error)
          .setTitle('❌ Failed to Create Channel')
          .setDescription('Could not create the temporary voice channel. Please check the bot permissions and configuration.')
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    } catch (error) {
      logger.error('Error creating temp channel from modal:', error);
      
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
