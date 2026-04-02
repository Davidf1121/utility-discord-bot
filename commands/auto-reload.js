import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('auto-reload')
    .setDescription('Enable or disable automatic config reloading')
    .addBooleanOption(option =>
      option.setName('enabled')
        .setDescription('Enable or disable auto-reload (true/false)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const enabled = interaction.options.getBoolean('enabled');
    const config = interaction.client.tempChannelManager.config;

    if (!config.autoReload) {
      await interaction.reply({
        content: '❌ Auto-reload configuration not found in config.json',
        ephemeral: true
      });
      return;
    }

    const wasEnabled = config.autoReload.enabled;
    config.autoReload.enabled = enabled;

    if (enabled && !wasEnabled) {
      interaction.client.startAutoReload();
    } else if (!enabled && wasEnabled) {
      interaction.client.stopAutoReload();
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColors.primary)
      .setTitle('🔄 Auto-Reload Configuration')
      .setDescription(`Auto-reload has been ${enabled ? 'enabled' : 'disabled'}`)
      .addFields(
        {
          name: 'Status',
          value: enabled ? '✅ Enabled' : '❌ Disabled',
          inline: true
        },
        {
          name: 'Interval',
          value: `${config.autoReload.intervalSeconds || 60} seconds`,
          inline: true
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
