import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { saveConfig, loadConfig } from '../utils/ConfigLoader.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setting')
    .setDescription('Manage bot settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Show all current settings'))
    .addSubcommandGroup(group =>
      group
        .setName('embed')
        .setDescription('Manage embed settings')
        .addSubcommand(subcommand =>
          subcommand
            .setName('colors')
            .setDescription('Show all embed colors'))
        .addSubcommand(subcommand =>
          subcommand
            .setName('color')
            .setDescription('Set specific feature color')
            .addStringOption(option =>
              option
                .setName('feature')
                .setDescription('The feature to set the color for')
                .setRequired(true)
                .addChoices(
                  { name: 'Primary', value: 'primary' },
                  { name: 'Success', value: 'success' },
                  { name: 'Warning', value: 'warning' },
                  { name: 'Error', value: 'error' },
                  { name: 'Temp Voice', value: 'tempVoice' },
                  { name: 'Tickets', value: 'ticket' },
                  { name: 'Video Notifier', value: 'videoNotifier' },
                  { name: 'GitHub', value: 'github' },
                  { name: 'Minecraft Server', value: 'mcsrv' },
                  { name: 'RCON', value: 'rcon' },
                  { name: 'Auto Moderation', value: 'autoModeration' }
                ))
            .addStringOption(option =>
              option
                .setName('hex')
                .setDescription('Hex color code (e.g., #2f3136)')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('reset')
            .setDescription('Reset embed colors to defaults'))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    if (group === 'embed') {
      if (subcommand === 'colors') {
        return handleEmbedColors(interaction);
      } else if (subcommand === 'color') {
        return handleSetEmbedColor(interaction);
      } else if (subcommand === 'reset') {
        return handleResetEmbedColors(interaction);
      }
    }

    if (subcommand === 'list') {
      return handleListSettings(interaction);
    }
  }
};

async function handleListSettings(interaction) {
  const config = loadConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Bot Settings')
    .setColor(config.embedColors.primary)
    .addFields(
      { name: 'Voice Category ID', value: config.voiceCategoryId || 'Not set', inline: true },
      { name: 'Control Channel ID', value: config.controlChannelId || 'Not set', inline: true },
      { name: 'Client ID', value: config.clientId || 'Not set', inline: true },
      { name: 'Guild ID', value: config.guildId || 'Not set', inline: true }
    )
    .addFields(
      { name: 'Enabled Features', value: Object.entries(config.features)
          .map(([name, enabled]) => `${enabled ? '✅' : '❌'} ${name}`)
          .join('\n') }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleEmbedColors(interaction) {
  const config = loadConfig();
  const colors = config.embedColors;
  
  const embed = new EmbedBuilder()
    .setTitle('🎨 Embed Colors')
    .setColor(colors.primary)
    .setDescription('Current color configuration for embeds:')
    .addFields(
      { name: 'General', value: [
        `**Primary:** #${colors.primary.toString(16).padStart(6, '0')}`,
        `**Success:** #${colors.success.toString(16).padStart(6, '0')}`,
        `**Warning:** #${colors.warning.toString(16).padStart(6, '0')}`,
        `**Error:** #${colors.error.toString(16).padStart(6, '0')}`
      ].join('\n'), inline: false },
      { name: 'Features', value: [
        `**Temp Voice:** #${colors.tempVoice.toString(16).padStart(6, '0')}`,
        `**Tickets:** #${colors.ticket.toString(16).padStart(6, '0')}`,
        `**Video Notifier:** #${colors.videoNotifier.toString(16).padStart(6, '0')}`,
        `**GitHub:** #${colors.github.toString(16).padStart(6, '0')}`,
        `**Minecraft Server:** #${colors.mcsrv.toString(16).padStart(6, '0')}`,
        `**RCON:** #${colors.rcon.toString(16).padStart(6, '0')}`,
        `**Auto Moderation:** #${colors.autoModeration.toString(16).padStart(6, '0')}`
      ].join('\n'), inline: false }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSetEmbedColor(interaction) {
  const feature = interaction.options.getString('feature');
  let hex = interaction.options.getString('hex').replace('#', '');
  
  // Validate hex
  if (!/^[0-9A-F]{6}$/i.test(hex)) {
    return interaction.reply({ 
      content: '❌ Invalid hex color code. Please use a 6-character hex code (e.g., #2f3136 or 2f3136).', 
      ephemeral: true 
    });
  }

  const decimal = parseInt(hex, 16);
  const config = loadConfig();
  
  config.embedColors[feature] = decimal;
  saveConfig(config);

  const embed = new EmbedBuilder()
    .setTitle('✅ Color Updated')
    .setColor(decimal)
    .setDescription(`The color for **${feature}** has been set to **#${hex}**.`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleResetEmbedColors(interaction) {
  const config = loadConfig();
  
  config.embedColors = {
    "primary": 2894668,
    "success": 5793287,
    "warning": 16775964,
    "error": 15548997,
    "tempVoice": 2894668,
    "ticket": 2894668,
    "videoNotifier": 2894668,
    "github": 2894668,
    "mcsrv": 2894668,
    "rcon": 2894668,
    "autoModeration": 2894668
  };
  
  saveConfig(config);

  await interaction.reply({ 
    content: '✅ Embed colors have been reset to default values.', 
    ephemeral: true 
  });
}
