import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Send the control panel with the create channel button'),
  async execute(interaction) {
    const config = interaction.client.tempChannelManager.config;
    
    const embed = new EmbedBuilder()
      .setColor(config.embedColors.primary)
      .setTitle('🎤 Temporary Voice Channels')
      .setDescription('Click the button below to create your own temporary voice channel!')
      .addFields(
        { name: 'How it works', value: '1. Click "Create Channel"\n2. Customize your channel\n3. Your channel is created!\n4. It auto-deletes when empty', inline: false },
        { name: 'Note', value: 'You can also join the "Create Voice Channel" voice channel to automatically get a temp channel.', inline: false }
      )
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('create_temp_channel')
      .setLabel('🎤 Create Voice Channel')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
