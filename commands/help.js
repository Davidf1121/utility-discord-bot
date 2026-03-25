import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about available commands'),
  async execute(interaction) {
    const config = interaction.client.tempChannelManager.config;
    
    const embed = new EmbedBuilder()
      .setColor(config.embedColors.primary)
      .setTitle('📚 Bot Commands')
      .setDescription('List of available commands:')
      .addFields(
        { name: '/ping', value: 'Check bot latency', inline: true },
        { name: '/create', value: 'Open the channel creation panel', inline: true },
        { name: '/setup', value: 'Send the control panel message', inline: true },
        { name: '/help', value: 'Show this help message', inline: true }
      )
      .addFields(
        { name: 'Temporary Voice Channels', value: 'Create temporary voice channels that auto-delete when empty. Use the button or join the creation channel!', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Utility Discord Bot v1.0.0' });

    await interaction.reply({ embeds: [embed] });
  }
};
