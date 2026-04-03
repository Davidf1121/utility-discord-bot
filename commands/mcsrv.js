import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { MinecraftPing } from '../utils/MinecraftPing.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mcsrv')
    .setDescription('Minecraft server ping and management')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ping')
        .setDescription('Ping a Minecraft server to check its status')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Server address (e.g., play.example.com or play.example.com:25565)')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Server type (auto-detected if not specified)')
            .setRequired(false)
            .addChoices(
              { name: 'Java Edition', value: 'java' },
              { name: 'Bedrock Edition', value: 'bedrock' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all saved Minecraft servers'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Save a Minecraft server for quick access')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Server address (e.g., play.example.com or play.example.com:25565)')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Custom name for this server')
            .setRequired(false))
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Server type (auto-detected if not specified)')
            .setRequired(false)
            .addChoices(
              { name: 'Java Edition', value: 'java' },
              { name: 'Bedrock Edition', value: 'bedrock' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a saved Minecraft server')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Server address to remove')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Get detailed info about a saved server')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Server address')
            .setRequired(true)
            .setAutocomplete(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'ping':
        return handlePing(interaction);
      case 'list':
        return handleList(interaction);
      case 'add':
        return handleAdd(interaction);
      case 'remove':
        return handleRemove(interaction);
      case 'info':
        return handleInfo(interaction);
    }
  }
};

async function handlePing(interaction) {
  await interaction.deferReply();

  const address = interaction.options.getString('address');
  const type = interaction.options.getString('type') || 'java';

  const mcPing = new MinecraftPing(interaction.client.tempChannelManager.config);

  try {
    const [host, port] = parseAddress(address);

    const result = await mcPing.pingServer(host, port, type);

    const { embed, iconBuffer } = mcPing.createPingEmbed(result, interaction.client.tempChannelManager.config);

    const files = iconBuffer ? [{ attachment: iconBuffer, name: 'icon.png' }] : [];

    await interaction.editReply({
      embeds: [embed],
      files: files
    });
  } catch (error) {
    await interaction.editReply({
      content: `❌ Error pinging server: ${error.message}`
    });
  }
}

async function handleList(interaction) {
  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.mcsrv?.savedServers || [];

  if (savedServers.length === 0) {
    return interaction.reply({
      content: '❌ No saved servers found. Use `/mcsrv add` to save a server.',
      ephemeral: true
    });
  }

  const fields = savedServers.map(server => ({
    name: server.name || server.address,
    value: [
      `📍 ${server.address}`,
      `${server.type === 'bedrock' ? '📱 Bedrock' : '☕ Java'}`,
      server.description ? `📝 ${server.description}` : ''
    ].filter(Boolean).join('\n'),
    inline: true
  }));

  const embed = new EmbedBuilder()
    .setColor(config.embedColors.primary)
    .setTitle('🎮 Saved Minecraft Servers')
    .setDescription(`Found ${savedServers.length} saved server${savedServers.length > 1 ? 's' : ''}`)
    .addFields(fields)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleAdd(interaction) {
  const address = interaction.options.getString('address');
  const name = interaction.options.getString('name');
  const type = interaction.options.getString('type');

  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.mcsrv?.savedServers || [];

  if (savedServers.some(s => s.address.toLowerCase() === address.toLowerCase())) {
    return interaction.reply({
      content: '❌ This server is already saved.',
      ephemeral: true
    });
  }

  const [host, port] = parseAddress(address);

  const mcPing = new MinecraftPing(config);

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await mcPing.pingServer(host, port, type || 'java');

    if (!result.success) {
      return interaction.editReply({
        content: `⚠️ Server offline, but saving anyway. Address: ${address}`
      });
    }

    const newServer = {
      address,
      name: name || result.host,
      type: result.type,
      description: result.motd.clean?.substring(0, 100) || null,
      addedAt: new Date().toISOString()
    };

    savedServers.push(newServer);

    const { loadConfig } = await import('../utils/ConfigLoader.js');
    const { writeFileSync } = await import('fs');
    const newConfig = loadConfig();
    newConfig.mcsrv.savedServers = savedServers;
    writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));

    await interaction.editReply({
      content: `✅ Server saved successfully!\n\n**Address:** ${address}\n**Name:** ${newServer.name}\n**Type:** ${result.type === 'java' ? '☕ Java' : '📱 Bedrock'}\n**Players:** ${result.players.online}/${result.players.max}`
    });
  } catch (error) {
    await interaction.editReply({
      content: `❌ Error adding server: ${error.message}`
    });
  }
}

async function handleRemove(interaction) {
  const address = interaction.options.getString('address');

  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.mcsrv?.savedServers || [];

  const index = savedServers.findIndex(s => s.address.toLowerCase() === address.toLowerCase());

  if (index === -1) {
    return interaction.reply({
      content: '❌ Server not found in saved servers list.',
      ephemeral: true
    });
  }

  const removed = savedServers.splice(index, 1)[0];

  const { loadConfig } = await import('../utils/ConfigLoader.js');
  const { writeFileSync } = await import('fs');
  const newConfig = loadConfig();
  newConfig.mcsrv.savedServers = savedServers;
  writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));

  await interaction.reply({
    content: `✅ Removed server: ${removed.name || removed.address}`,
    ephemeral: true
  });
}

async function handleInfo(interaction) {
  const address = interaction.options.getString('address');

  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.mcsrv?.savedServers || [];

  const server = savedServers.find(s => s.address.toLowerCase() === address.toLowerCase());

  if (!server) {
    return interaction.reply({
      content: '❌ Server not found in saved servers list.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const mcPing = new MinecraftPing(config);
  const [host, port] = parseAddress(server.address);

  try {
    const result = await mcPing.pingServer(host, port, server.type);

    const { embed, iconBuffer } = mcPing.createPingEmbed(result, config);

    const files = iconBuffer ? [{ attachment: iconBuffer, name: 'icon.png' }] : [];

    embed.fields.unshift({
      name: '📌 Saved Name',
      value: server.name || server.address,
      inline: false
    });

    embed.fields.push({
      name: '🕒 Added',
      value: server.addedAt ? new Date(server.addedAt).toLocaleDateString() : 'Unknown',
      inline: true
    });

    if (server.description) {
      embed.fields.push({
        name: '📝 Description',
        value: server.description,
        inline: false
      });
    }

    await interaction.editReply({
      embeds: [embed],
      files: files
    });
  } catch (error) {
    await interaction.editReply({
      content: `❌ Error fetching server info: ${error.message}`
    });
  }
}

function parseAddress(address) {
  const parts = address.split(':');

  if (parts.length > 2) {
    return [address, null];
  }

  const host = parts[0];
  const port = parts.length === 2 ? parseInt(parts[1], 10) : null;

  if (port && (port < 1 || port > 65535)) {
    throw new Error('Invalid port number');
  }

  return [host, port];
}

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.mcsrv?.savedServers || [];

  const choices = savedServers
    .filter(server => 
      server.name?.toLowerCase().includes(focusedValue.toLowerCase()) ||
      server.address.toLowerCase().includes(focusedValue.toLowerCase())
    )
    .map(server => ({
      name: server.name || server.address,
      value: server.address
    }))
    .slice(0, 25);

  await interaction.respond(choices);
}
