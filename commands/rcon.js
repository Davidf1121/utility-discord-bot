import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rcon')
    .setDescription('Minecraft RCON console command execution')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Save a Minecraft RCON server for command execution')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Unique name for this server')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Server address (e.g., play.example.com or play.example.com:25575)')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('password')
            .setDescription('RCON password')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a saved RCON server')
        .addStringOption(option =>
          option
            .setName('server')
            .setDescription('Server name to remove')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all saved RCON servers'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('run')
        .setDescription('Execute a command on a Minecraft server')
        .addStringOption(option =>
          option
            .setName('server')
            .setDescription('Server to execute command on')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option =>
          option
            .setName('command')
            .setDescription('Minecraft server command (e.g., /op player)')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'add':
        return handleAdd(interaction);
      case 'remove':
        return handleRemove(interaction);
      case 'list':
        return handleList(interaction);
      case 'run':
        return handleRun(interaction);
    }
  }
};

async function handleAdd(interaction) {
  const name = interaction.options.getString('name');
  const address = interaction.options.getString('address');
  const password = interaction.options.getString('password');

  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.rcon?.savedServers || [];

  if (savedServers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    return interaction.reply({
      content: '❌ A server with this name already exists.',
      ephemeral: true
    });
  }

  if (savedServers.some(s => s.address.toLowerCase() === address.toLowerCase())) {
    return interaction.reply({
      content: '❌ This server address is already saved.',
      ephemeral: true
    });
  }

  const rcon = interaction.client.minecraftRcon;

  try {
    const { host, port } = rcon.parseServerAddress(address);

    await interaction.deferReply({ ephemeral: true });

    const testResult = await rcon.testConnection({ host, port, password, address, name });

    if (!testResult.success) {
      await interaction.editReply({
        content: `⚠️ Could not connect to RCON server. Server saved anyway.\n\n**Error:** ${testResult.message}\n\n**Name:** ${name}\n**Address:** ${address}`
      });
    } else {
      await interaction.editReply({
        content: `✅ RCON server added and connection verified!\n\n**Name:** ${name}\n**Address:** ${address}\n**Status:** Connected\n${testResult.players ? `**Players:** ${testResult.players}` : ''}`
      });
    }

    const newServer = {
      name,
      address,
      host,
      port,
      password,
      addedAt: new Date().toISOString()
    };

    savedServers.push(newServer);

    const { loadConfig } = await import('../utils/ConfigLoader.js');
    const { writeFileSync } = await import('fs');
    const newConfig = loadConfig();
    newConfig.rcon = newConfig.rcon || {};
    newConfig.rcon.savedServers = savedServers;
    writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));

  } catch (error) {
    if (interaction.deferred) {
      await interaction.editReply({
        content: `❌ Error adding server: ${error.message}`
      });
    } else {
      await interaction.reply({
        content: `❌ Error adding server: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

async function handleRemove(interaction) {
  const name = interaction.options.getString('server');

  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.rcon?.savedServers || [];

  const index = savedServers.findIndex(s => s.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    return interaction.reply({
      content: '❌ Server not found in saved RCON servers list.',
      ephemeral: true
    });
  }

  const removed = savedServers.splice(index, 1)[0];
  
  const rcon = interaction.client.minecraftRcon;
  await rcon.disconnect(removed);

  const { loadConfig } = await import('../utils/ConfigLoader.js');
  const { writeFileSync } = await import('fs');
  const newConfig = loadConfig();
  newConfig.rcon = newConfig.rcon || {};
  newConfig.rcon.savedServers = savedServers;
  writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));

  await interaction.reply({
    content: `✅ Removed RCON server: ${removed.name} (${removed.address})`,
    ephemeral: true
  });
}

async function handleList(interaction) {
  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.rcon?.savedServers || [];

  if (savedServers.length === 0) {
    return interaction.reply({
      content: '❌ No saved RCON servers found. Use `/rcon add` to add a server.',
      ephemeral: true
    });
  }

  const fields = savedServers.map(server => ({
    name: `🖥️ ${server.name}`,
    value: [
      `📍 ${server.address}`,
      `🔑 Port: ${server.port}`,
      `🕒 Added: ${server.addedAt ? new Date(server.addedAt).toLocaleDateString() : 'Unknown'}`
    ].join('\n'),
    inline: true
  }));

  const embed = new EmbedBuilder()
    .setColor(config.embedColors.rcon || config.embedColors.primary)
    .setTitle('🎮 Saved RCON Servers')
    .setDescription(`Found ${savedServers.length} saved server${savedServers.length > 1 ? 's' : ''}`)
    .addFields(fields)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleRun(interaction) {
  const serverName = interaction.options.getString('server');
  const command = interaction.options.getString('command');

  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.rcon?.savedServers || [];

  const server = savedServers.find(s => s.name.toLowerCase() === serverName.toLowerCase());

  if (!server) {
    return interaction.reply({
      content: '❌ Server not found. Use `/rcon list` to see available servers.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const rcon = interaction.client.minecraftRcon;

  try {
    const result = await rcon.executeCommand(server, command);

    if (!result.success) {
      const embed = new EmbedBuilder()
        .setColor(config.embedColors.error)
        .setTitle('❌ Command Execution Failed')
        .setDescription(`Server: ${server.name} (${server.address})`)
        .addFields(
          { name: 'Command', value: `\`\`\`${command}\`\`\``, inline: false },
          { name: 'Error', value: result.error, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const response = result.response || 'No output from server';
    const maxLength = 4000;
    
    let displayResponse = response;
    let isTruncated = false;

    if (response.length > maxLength) {
      displayResponse = response.substring(0, maxLength - 20) + '\n... (truncated)';
      isTruncated = true;
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColors.success)
      .setTitle('✅ Command Executed')
      .setDescription(`Server: ${server.name} (${server.address})`)
      .addFields(
        { 
          name: 'Command', 
          value: `\`\`\`${command}\`\`\``, 
          inline: false 
        },
        { 
          name: 'Response', 
          value: `\`\`\`\n${displayResponse}\n\`\`\``, 
          inline: false 
        }
      )
      .setTimestamp();

    if (isTruncated) {
      embed.setFooter({ text: 'Response was truncated due to length limit' });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    await interaction.editReply({
      content: `❌ Error executing command: ${error.message}`
    });
  }
}

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const config = interaction.client.tempChannelManager.config;
  const savedServers = config.rcon?.savedServers || [];

  const choices = savedServers
    .filter(server => 
      server.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
      server.address.toLowerCase().includes(focusedValue.toLowerCase())
    )
    .map(server => ({
      name: `${server.name} (${server.address})`,
      value: server.name
    }))
    .slice(0, 25);

  await interaction.respond(choices);
}
