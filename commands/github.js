import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('Manage GitHub notifications')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-channel')
        .setDescription('Set the Discord channel for GitHub notifications')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send notifications to')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('The message to send when a new GitHub event occurs')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-port')
        .setDescription('Set the port for the GitHub webhook server')
        .addIntegerOption(option =>
          option
            .setName('port')
            .setDescription('The port to listen on (default: 3000)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle GitHub notifications on or off'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Show GitHub notifier status'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('test-push')
        .setDescription('Send a test GitHub push notification'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const manager = interaction.client.githubNotifierManager;

    if (!manager) {
      return interaction.reply({
        content: '❌ GitHub notifier manager is not initialized',
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'set-channel':
        return handleSetChannel(interaction, manager);
      case 'set-port':
        return handleSetPort(interaction, manager);
      case 'toggle':
        return handleToggle(interaction, manager);
      case 'status':
        return handleStatus(interaction, manager);
      case 'test-push':
        return handleTestPush(interaction, manager);
    }
  }
};

async function handleSetChannel(interaction, manager) {
  const channel = interaction.options.getChannel('channel');
  const customMessage = interaction.options.getString('message');
  
  const configUpdates = { notificationChannelId: channel.id };
  if (customMessage) {
    configUpdates.notificationMessage = customMessage;
  }
  
  const result = await manager.updateConfig(configUpdates);
  
  if (result.success) {
    let response = `✅ GitHub notification channel set to ${channel}`;
    if (customMessage) {
      response += `\n✅ Notification message set to: ${customMessage}`;
    }
    await interaction.reply({
      content: response,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleSetPort(interaction, manager) {
  const port = interaction.options.getInteger('port');
  const result = await manager.updateConfig({ port });
  
  if (result.success) {
    await interaction.reply({
      content: `✅ GitHub webhook server port set to ${port}. Restarting server...`,
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
  const currentStatus = manager.config.github?.enabled ?? true;
  const newStatus = !currentStatus;
  
  const result = await manager.updateConfig({ enabled: newStatus });
  
  if (result.success) {
    await interaction.reply({
      content: `✅ GitHub notifications ${newStatus ? 'enabled' : 'disabled'}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleStatus(interaction, manager) {
  const config = manager.config.github;
  const status = config?.enabled ? '✅ Enabled' : '❌ Disabled';
  const port = config?.port || 3000;
  const channel = config?.notificationChannelId ? `<#${config.notificationChannelId}>` : 'Not set';
  const webhookUrl = `/github-webhook (port: ${port})`;

  const embed = new EmbedBuilder()
    .setColor(manager.config.embedColors.github || manager.config.embedColors.primary)
    .setTitle('🐙 GitHub Notifier Status')
    .addFields(
      { name: 'Status', value: status, inline: true },
      { name: 'Port', value: port.toString(), inline: true },
      { name: 'Channel', value: channel, inline: false },
      { name: 'Webhook Path', value: webhookUrl, inline: false }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleTestPush(interaction, manager) {
  try {
    await interaction.deferReply({ ephemeral: true });
    await manager.sendTestPushNotification();
    await interaction.editReply('✅ Test GitHub push notification sent!');
  } catch (error) {
    await interaction.editReply(`❌ Error sending test notification: ${error.message}`);
  }
}
