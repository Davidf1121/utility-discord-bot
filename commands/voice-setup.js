import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { getDefaultThumbnail, getMessageStyle } from '../utils/ConfigLoader.js';
import { ComponentBuilder } from '../utils/ComponentBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('voice-setup')
    .setDescription('Setup the temporary voice channel creation panel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to send the setup message to (defaults to current channel)'))
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Custom description for the setup message'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const customMessage = interaction.options.getString('message');
    
    const config = interaction.client.tempChannelManager.config;
    const style = getMessageStyle(config, 'tempVoiceChannels');
    
    const button = ComponentBuilder.createButton({
      customId: 'create_temp_channel',
      label: '🎤 Create Voice Channel',
      style: ButtonStyle.Primary
    });

    let messagePayload;

    if (style === 'v2') {
      messagePayload = ComponentBuilder.buildV2Message({
        title: '🎤 Temporary Voice Channels',
        separator: true,
        description: customMessage || 'Click the button below to create your own temporary voice channel!\n\n' +
                    '**How it works**\n' +
                    '1. Click "Create Channel"\n2. Customize your channel\n3. Your channel is created!\n4. It auto-deletes when empty\n\n' +
                    '**Note**: You can also join the "Create Voice Channel" voice channel to automatically get a temp channel.',
        components: [button],
        accentColor: config.embedColors.tempVoice || config.embedColors.primary
      });
    } else {
      const embed = new EmbedBuilder()
        .setColor(config.embedColors.tempVoice || config.embedColors.primary)
        .setTitle('🎤 Temporary Voice Channels')
        .setThumbnail(getDefaultThumbnail(config, interaction.client))
        .setDescription(customMessage || 'Click the button below to create your own temporary voice channel!')
        .setTimestamp();

      if (!customMessage) {
        embed.addFields(
          { name: 'How it works', value: '1. Click "Create Channel"\n2. Customize your channel\n3. Your channel is created!\n4. It auto-deletes when empty', inline: false },
          { name: 'Note', value: 'You can also join the "Create Voice Channel" voice channel to automatically get a temp channel.', inline: false }
        );
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder(button)
      );

      messagePayload = {
        embeds: [embed],
        components: [row]
      };
    }

    if (targetChannel.id === interaction.channel.id) {
      await interaction.reply(messagePayload);
    } else {
      try {
        await targetChannel.send(messagePayload);
        await interaction.reply({ content: `✅ Setup message sent to ${targetChannel}`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: `❌ Failed to send message to ${targetChannel}: ${error.message}`, ephemeral: true });
      }
    }
  }
};
