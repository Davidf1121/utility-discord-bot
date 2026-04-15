import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDefaultThumbnail, getMessageStyle } from '../utils/ConfigLoader.js';
import { ComponentBuilder } from '../utils/ComponentBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Send the control panel with the create channel button'),
  async execute(interaction) {
    const config = interaction.client.tempChannelManager.config;
    const style = getMessageStyle(config, 'tempVoiceChannels');
    
    const button = ComponentBuilder.createButton({
      customId: 'create_temp_channel',
      label: '🎤 Create Voice Channel',
      style: ButtonStyle.Primary
    });

    if (style === 'v2') {
      const v2Message = ComponentBuilder.buildV2Message({
        title: '🎤 Temporary Voice Channels',
        description: 'Click the button below to create your own temporary voice channel!\n\n' +
                    '**How it works**\n' +
                    '1. Click "Create Channel"\n2. Customize your channel\n3. Your channel is created!\n4. It auto-deletes when empty\n\n' +
                    '**Note**: You can also join the "Create Voice Channel" voice channel to automatically get a temp channel.',
        components: [button],
        accentColor: config.embedColors.tempVoice || config.embedColors.primary
      });
      
      await interaction.reply(v2Message);
    } else {
      const embed = new EmbedBuilder()
        .setColor(config.embedColors.tempVoice || config.embedColors.primary)
        .setTitle('🎤 Temporary Voice Channels')
        .setThumbnail(getDefaultThumbnail(config, interaction.client))
        .setDescription('Click the button below to create your own temporary voice channel!')
        .addFields(
          { name: 'How it works', value: '1. Click "Create Channel"\n2. Customize your channel\n3. Your channel is created!\n4. It auto-deletes when empty', inline: false },
          { name: 'Note', value: 'You can also join the "Create Voice Channel" voice channel to automatically get a temp channel.', inline: false }
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder(button)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }
};
