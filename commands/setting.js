import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { saveConfig, loadConfig, getDefaultThumbnail } from '../utils/ConfigLoader.js';

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
            .setName('thumbnail')
            .setDescription('Manage default embed thumbnail')
            .addStringOption(option =>
              option
                .setName('action')
                .setDescription('Action to perform')
                .setRequired(true)
                .addChoices(
                  { name: 'Set custom URL', value: 'set' },
                  { name: 'Clear (use bot avatar)', value: 'clear' },
                  { name: 'Show current', value: 'show' }
                ))
            .addStringOption(option =>
              option
                .setName('url')
                .setDescription('The thumbnail URL (required for set)')))
        .addSubcommand(subcommand =>
          subcommand
            .setName('reset')
            .setDescription('Reset embed settings to defaults')))
    .addSubcommandGroup(group =>
      group
        .setName('bot')
        .setDescription('Manage core bot settings')
        .addSubcommand(subcommand =>
          subcommand
            .setName('ids')
            .setDescription('Set core Discord IDs')
            .addStringOption(option =>
              option
                .setName('type')
                .setDescription('The type of ID to set')
                .setRequired(true)
                .addChoices(
                  { name: 'Client ID', value: 'clientId' },
                  { name: 'Guild ID', value: 'guildId' },
                  { name: 'Control Channel ID', value: 'controlChannelId' },
                  { name: 'Voice Category ID', value: 'voiceCategoryId' }
                ))
            .addStringOption(option =>
              option
                .setName('id')
                .setDescription('The Discord ID (will be stored as string)')
                .setRequired(true))))
    .addSubcommandGroup(group =>
      group
        .setName('ticket')
        .setDescription('Manage ticket system settings')
        .addSubcommand(subcommand =>
          subcommand
            .setName('category')
            .setDescription('Set the category for ticket channels')
            .addChannelOption(option =>
              option
                .setName('category')
                .setDescription('The category channel')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('staff-role')
            .setDescription('Add or remove a staff role')
            .addStringOption(option =>
              option
                .setName('action')
                .setDescription('Add or remove')
                .setRequired(true)
                .addChoices(
                  { name: 'Add', value: 'add' },
                  { name: 'Remove', value: 'remove' }
                ))
            .addRoleOption(option =>
              option
                .setName('role')
                .setDescription('The role to add or remove')
                .setRequired(true))))
    .addSubcommandGroup(group =>
      group
        .setName('style')
        .setDescription('Manage message styles')
        .addSubcommand(subcommand =>
          subcommand
            .setName('global')
            .setDescription('Set global message style')
            .addStringOption(option =>
              option
                .setName('style')
                .setDescription('The style to use')
                .setRequired(true)
                .addChoices(
                  { name: 'Embed', value: 'embed' },
                  { name: 'v2 (Layout Components)', value: 'v2' }
                )))
        .addSubcommand(subcommand =>
          subcommand
            .setName('feature')
            .setDescription('Set specific feature message style')
            .addStringOption(option =>
              option
                .setName('feature')
                .setDescription('The feature to set the style for')
                .setRequired(true)
                .addChoices(
                  { name: 'Tickets', value: 'ticketSystem' },
                  { name: 'Temp Voice', value: 'tempVoiceChannels' },
                  { name: 'Embed Creator', value: 'embedCreator' },
                  { name: 'Video Notifier', value: 'videoNotifier' },
                  { name: 'Auto Moderation', value: 'autoModeration' }
                ))
            .addStringOption(option =>
              option
                .setName('style')
                .setDescription('The style to use')
                .setRequired(true)
                .addChoices(
                  { name: 'Inherit Global', value: 'inherit' },
                  { name: 'Embed', value: 'embed' },
                  { name: 'v2 (Layout Components)', value: 'v2' }
                )))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    if (group === 'embed') {
      if (subcommand === 'colors') return handleEmbedColors(interaction);
      if (subcommand === 'color') return handleSetEmbedColor(interaction);
      if (subcommand === 'thumbnail') return handleEmbedThumbnail(interaction);
      if (subcommand === 'reset') return handleResetEmbedColors(interaction);
    }

    if (group === 'bot') {
      if (subcommand === 'ids') return handleSetBotIds(interaction);
    }

    if (group === 'ticket') {
      if (subcommand === 'category') return handleSetTicketCategory(interaction);
      if (subcommand === 'staff-role') return handleTicketStaffRole(interaction);
    }

    if (group === 'style') {
      if (subcommand === 'global') return handleSetGlobalStyle(interaction);
      if (subcommand === 'feature') return handleSetFeatureStyle(interaction);
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
    .setThumbnail(getDefaultThumbnail(config, interaction.client))
    .setColor(config.embedColors.primary)
    .addFields(
      { name: 'Voice Category ID', value: config.voiceCategoryId || 'Not set', inline: true },
      { name: 'Control Channel ID', value: config.controlChannelId || 'Not set', inline: true },
      { name: 'Client ID', value: config.clientId || 'Not set', inline: true },
      { name: 'Guild ID', value: config.guildId || 'Not set', inline: true }
    )
    .addFields(
      { name: 'Ticket Settings', value: [
        `**Category:** ${config.ticketSystem.ticketCategoryId || 'Not set'}`,
        `**Staff Roles:** ${config.ticketSystem.ticketStaffRoles?.length ? config.ticketSystem.ticketStaffRoles.map(id => `<@&${id}>`).join(', ') : 'None'}`
      ].join('\n') }
    )
    .addFields(
      { name: 'Enabled Features', value: Object.entries(config.features)
          .map(([name, enabled]) => `${enabled ? '✅' : '❌'} ${name}`)
          .join('\n') }
    )
    .addFields(
      { name: 'Message Styles', value: [
        `**Global:** ${config.messageStyle || 'embed'}`,
        `**Tickets:** ${config.ticketSystem.messageStyle || 'inherit'}`,
        `**Temp Voice:** ${config.tempChannelSettings.messageStyle || 'inherit'}`,
        `**Embed Creator:** ${config.embedCreator?.messageStyle || 'inherit'}`,
        `**Video Notifier:** ${config.videoNotifier?.notificationStyle || 'inherit'}`,
        `**Auto Moderation:** ${config.autoModeration?.logChannelStyle || 'inherit'}`
      ].join('\n') }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSetBotIds(interaction) {
  const type = interaction.options.getString('type');
  const id = interaction.options.getString('id');
  const config = loadConfig();

  // Ensure it's stored as a string (getString already returns a string, but just to be safe)
  config[type] = String(id).trim();
  saveConfig(config);

  await interaction.reply({
    content: `✅ **${type}** has been set to \`${config[type]}\`.`,
    ephemeral: true
  });
}

async function handleSetTicketCategory(interaction) {
  const category = interaction.options.getChannel('category');
  const config = loadConfig();

  config.ticketSystem.ticketCategoryId = String(category.id);
  saveConfig(config);

  await interaction.reply({
    content: `✅ Ticket category has been set to **${category.name}** (\`${category.id}\`).`,
    ephemeral: true
  });
}

async function handleTicketStaffRole(interaction) {
  const action = interaction.options.getString('action');
  const role = interaction.options.getRole('role');
  const config = loadConfig();

  if (!config.ticketSystem.ticketStaffRoles) {
    config.ticketSystem.ticketStaffRoles = [];
  }

  const roleId = String(role.id);

  if (action === 'add') {
    if (config.ticketSystem.ticketStaffRoles.includes(roleId)) {
      return interaction.reply({ content: '❌ This role is already a staff role.', ephemeral: true });
    }
    config.ticketSystem.ticketStaffRoles.push(roleId);
  } else {
    const index = config.ticketSystem.ticketStaffRoles.indexOf(roleId);
    if (index === -1) {
      return interaction.reply({ content: '❌ This role is not a staff role.', ephemeral: true });
    }
    config.ticketSystem.ticketStaffRoles.splice(index, 1);
  }

  saveConfig(config);

  await interaction.reply({
    content: `✅ Role **${role.name}** has been ${action === 'add' ? 'added to' : 'removed from'} ticket staff roles.`,
    ephemeral: true
  });
}

async function handleEmbedColors(interaction) {
  const config = loadConfig();
  const colors = config.embedColors;
  
  const embed = new EmbedBuilder()
    .setTitle('🎨 Embed Colors')
    .setThumbnail(getDefaultThumbnail(config, interaction.client))
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
    "primary": 2500399,
    "success": 5793287,
    "warning": 16775964,
    "error": 15548997,
    "tempVoice": 2500399,
    "ticket": 2500399,
    "videoNotifier": 2500399,
    "github": 2500399,
    "mcsrv": 2500399,
    "rcon": 2500399,
    "autoModeration": 2500399
  };
  
  config.defaultEmbedThumbnail = null;
  
  saveConfig(config);

  await interaction.reply({ 
    content: '✅ Embed settings have been reset to default values.', 
    ephemeral: true 
  });
}

async function handleEmbedThumbnail(interaction) {
  const action = interaction.options.getString('action');
  const url = interaction.options.getString('url');
  const config = loadConfig();

  if (action === 'show') {
    const current = config.defaultEmbedThumbnail || 'Bot Avatar (default)';
    const embed = new EmbedBuilder()
      .setTitle('🖼️ Default Embed Thumbnail')
      .setColor(config.embedColors.primary)
      .setDescription(`Current setting: **${current}**`)
      .setTimestamp();
    
    if (config.defaultEmbedThumbnail) {
      embed.setThumbnail(config.defaultEmbedThumbnail);
    } else {
      embed.setThumbnail(interaction.client.user.displayAvatarURL());
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (action === 'clear') {
    config.defaultEmbedThumbnail = null;
    saveConfig(config);
    return interaction.reply({ content: '✅ Default embed thumbnail cleared. Now using bot avatar.', ephemeral: true });
  }

  if (action === 'set') {
    if (!url) {
      return interaction.reply({ content: '❌ Please provide a URL when using "Set custom URL".', ephemeral: true });
    }

    if (!url.startsWith('http')) {
      return interaction.reply({ content: '❌ Invalid URL. Must start with http:// or https://', ephemeral: true });
    }

    config.defaultEmbedThumbnail = url;
    saveConfig(config);

    const embed = new EmbedBuilder()
      .setTitle('✅ Thumbnail Updated')
      .setColor(config.embedColors.primary)
      .setDescription('Default embed thumbnail has been updated.')
      .setThumbnail(url)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function handleSetGlobalStyle(interaction) {
  const style = interaction.options.getString('style');
  const config = loadConfig();

  config.messageStyle = style;
  saveConfig(config);

  await interaction.reply({
    content: `✅ Global message style has been set to **${style}**.`,
    ephemeral: true
  });
}

async function handleSetFeatureStyle(interaction) {
  const feature = interaction.options.getString('feature');
  const style = interaction.options.getString('style');
  const config = loadConfig();

  if (feature === 'ticketSystem') {
    config.ticketSystem.messageStyle = style;
  } else if (feature === 'tempVoiceChannels') {
    config.tempChannelSettings.messageStyle = style;
  } else if (feature === 'embedCreator') {
    if (!config.embedCreator) config.embedCreator = {};
    config.embedCreator.messageStyle = style;
  } else if (feature === 'videoNotifier') {
    config.videoNotifier.notificationStyle = style;
  } else if (feature === 'autoModeration') {
    config.autoModeration.logChannelStyle = style;
  }

  saveConfig(config);

  await interaction.reply({
    content: `✅ Message style for **${feature}** has been set to **${style}**.`,
    ephemeral: true
  });
}
