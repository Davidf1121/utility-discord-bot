import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Open the temporary voice channel creation panel'),
  async execute(interaction) {
    const config = interaction.client.tempChannelManager.config;
    
    const embed = new EmbedBuilder()
      .setColor(config.embedColors.primary)
      .setTitle('🎤 Create Temporary Voice Channel')
      .setDescription('Click the button below to create your own temporary voice channel.')
      .addFields(
        { name: 'Features', value: '• Custom channel name\n• Set user limit\n• Auto-deletes when empty\n• Full control as owner', inline: false }
      )
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('create_temp_channel')
      .setLabel('Create Channel')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('➕');

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
