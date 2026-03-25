import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('videonotifier')
    .setDescription('Manage YouTube/TikTok video notifications')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all monitored channels'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-youtube')
        .setDescription('Add a YouTube channel to monitor')
        .addStringOption(option =>
          option
            .setName('channel-id')
            .setDescription('The YouTube channel ID')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('label')
            .setDescription('Custom label for the channel')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-youtube')
        .setDescription('Remove a YouTube channel from monitoring')
        .addStringOption(option =>
          option
            .setName('channel-id')
            .setDescription('The YouTube channel ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-tiktok')
        .setDescription('Add a TikTok channel to monitor')
        .addStringOption(option =>
          option
            .setName('username')
            .setDescription('The TikTok username (without @)')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('label')
            .setDescription('Custom label for the channel')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-tiktok')
        .setDescription('Remove a TikTok channel from monitoring')
        .addStringOption(option =>
          option
            .setName('username')
            .setDescription('The TikTok username (without @)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-channel')
        .setDescription('Set the Discord channel for notifications')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send notifications to')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle the video notifier on or off'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const manager = interaction.client.videoNotifierManager;

    if (!manager) {
      return interaction.reply({
        content: '❌ Video notifier manager is not initialized',
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'list':
        return handleList(interaction, manager);
      case 'add-youtube':
        return handleAddYouTube(interaction, manager);
      case 'remove-youtube':
        return handleRemoveYouTube(interaction, manager);
      case 'add-tiktok':
        return handleAddTikTok(interaction, manager);
      case 'remove-tiktok':
        return handleRemoveTikTok(interaction, manager);
      case 'set-channel':
        return handleSetChannel(interaction, manager);
      case 'toggle':
        return handleToggle(interaction, manager);
    }
  }
};

async function handleList(interaction, manager) {
  const channels = manager.listChannels();
  
  const youtubeList = channels.youtube.length > 0
    ? channels.youtube.map(c => `• ${c.label || c.id} (${c.id})`).join('\n')
    : 'None';
  
  const tiktokList = channels.tiktok.length > 0
    ? channels.tiktok.map(c => `• ${c.label || c.username} (@${c.username})`).join('\n')
    : 'None';

  const config = manager.config.videoNotifier;
  const status = config?.enabled ? '✅ Enabled' : '❌ Disabled';
  const checkInterval = config?.checkInterval ? `${config.checkInterval / 1000}s` : 'N/A';
  const notificationChannel = config?.notificationChannelId 
    ? `<#${config.notificationChannelId}>` 
    : 'Not set';

  const embed = {
    color: manager.config.embedColors.primary,
    title: '📺 Video Notifier Status',
    fields: [
      { name: 'Status', value: status, inline: true },
      { name: 'Check Interval', value: checkInterval, inline: true },
      { name: 'Notification Channel', value: notificationChannel, inline: false },
      { name: 'YouTube Channels', value: youtubeList, inline: false },
      { name: 'TikTok Channels', value: tiktokList, inline: false }
    ],
    timestamp: new Date()
  };

  await interaction.reply({ embeds: [embed] });
}

async function handleAddYouTube(interaction, manager) {
  const channelId = interaction.options.getString('channel-id');
  const label = interaction.options.getString('label');

  const result = manager.addYouTubeChannel(channelId, label);
  
  if (result.success) {
    await interaction.reply({
      content: `✅ ${result.message}\nChannel: ${label || channelId}\nID: ${channelId}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleRemoveYouTube(interaction, manager) {
  const channelId = interaction.options.getString('channel-id');

  const result = manager.removeYouTubeChannel(channelId);
  
  if (result.success) {
    await interaction.reply({
      content: `✅ ${result.message}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleAddTikTok(interaction, manager) {
  const username = interaction.options.getString('username');
  const label = interaction.options.getString('label');

  const result = manager.addTikTokChannel(username, label);
  
  if (result.success) {
    await interaction.reply({
      content: `✅ ${result.message}\nChannel: ${label || username}\n@${username}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleRemoveTikTok(interaction, manager) {
  const username = interaction.options.getString('username');

  const result = manager.removeTikTokChannel(username);
  
  if (result.success) {
    await interaction.reply({
      content: `✅ ${result.message}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleSetChannel(interaction, manager) {
  const channel = interaction.options.getChannel('channel');
  
  const result = manager.updateConfig({ notificationChannelId: channel.id });
  
  if (result.success) {
    await interaction.reply({
      content: `✅ Notification channel set to ${channel}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleToggle(interaction, manager) {
  const currentStatus = manager.config.videoNotifier?.enabled ?? true;
  const newStatus = !currentStatus;
  
  const result = manager.updateConfig({ enabled: newStatus });
  
  if (result.success) {
    if (newStatus) {
      manager.start();
    } else {
      manager.stop();
    }
    
    await interaction.reply({
      content: `✅ Video notifier ${newStatus ? 'enabled' : 'disabled'}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}
