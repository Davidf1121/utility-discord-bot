import { createLogger } from '../utils/Logger.js';

const logger = createLogger('PrefixCommand');

export default {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const { client } = message;
    
    // Check if auto-moderation manager exists
    if (client.autoModerationManager) {
      await client.autoModerationManager.handleMessage(message);
    }

    // Prefix command handling
    const config = client.tempChannelManager.config;
    const prefix = config.prefix || '!';

    if (!message.content.startsWith(prefix)) return;

    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const rawArgs = [];
    let match;
    const contentWithoutPrefix = message.content.slice(prefix.length).trim();
    while ((match = regex.exec(contentWithoutPrefix)) !== null) {
      rawArgs.push(match[1] || match[2] || match[0]);
    }

    if (rawArgs.length === 0) return;

    const commandName = rawArgs.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    // Check permissions
    if (command.data.default_member_permissions) {
      const permissions = BigInt(command.data.default_member_permissions);
      if (!message.member.permissions.has(permissions)) {
        return; // Silently ignore if they don't have permission
      }
    }

    const commandData = command.data.toJSON();
    let subcommandName = null;
    let subcommandGroup = null;
    const args = [...rawArgs];

    // Subcommand handling
    if (commandData.options) {
      const firstArg = args[0]?.toLowerCase();
      const option = commandData.options.find(opt => opt.name === firstArg);
      
      if (option && option.type === 1) { // Subcommand
        subcommandName = args.shift();
      } else if (option && option.type === 2) { // SubcommandGroup
        subcommandGroup = args.shift();
        const nextArg = args[0]?.toLowerCase();
        const subOption = option.options?.find(opt => opt.name === nextArg);
        if (subOption && subOption.type === 1) {
          subcommandName = args.shift();
        }
      }
    }

    // Create mock interaction
    const interaction = {
      client,
      guild: message.guild,
      channel: message.channel,
      user: message.author,
      member: message.member,
      commandName,
      commandId: null,
      createdAt: message.createdAt,
      createdTimestamp: message.createdTimestamp,
      deferred: false,
      replied: false,
      ephemeral: false,
      isChatInputCommand: () => true,
      isButton: () => false,
      isAutocomplete: () => false,
      isModalSubmit: () => false,
      
      options: {
        getSubcommand: () => subcommandName,
        getSubcommandGroup: () => subcommandGroup,
        _getOption: (name) => {
          let options = commandData.options;
          if (!options) return null;

          if (subcommandGroup) {
            const group = options.find(o => o.name === subcommandGroup);
            if (!group || !group.options) return null;
            options = group.options;
          }
          if (subcommandName) {
            const sub = options.find(o => o.name === subcommandName);
            if (!sub || !sub.options) return null;
            options = sub.options;
          }
          
          const realOptions = options.filter(o => o.type !== 1 && o.type !== 2);
          const optionIndex = realOptions.findIndex(o => o.name === name);
          
          return optionIndex !== -1 ? args[optionIndex] : null;
        },
        getString: (name) => {
          const val = interaction.options._getOption(name);
          return val !== null && val !== undefined ? String(val) : null;
        },
        getInteger: (name) => {
          const val = interaction.options._getOption(name);
          return val !== null && val !== undefined ? parseInt(val, 10) : null;
        },
        getNumber: (name) => {
          const val = interaction.options._getOption(name);
          return val !== null && val !== undefined ? parseFloat(val) : null;
        },
        getBoolean: (name) => {
          const val = interaction.options._getOption(name);
          if (val === 'true') return true;
          if (val === 'false') return false;
          return null;
        },
        getUser: (name) => {
          const val = interaction.options._getOption(name);
          if (!val) return null;
          const id = val.replace(/[<@!>]/g, '');
          return client.users.cache.get(id) || null;
        },
        getMember: (name) => {
          const val = interaction.options._getOption(name);
          if (!val) return null;
          const id = val.replace(/[<@!>]/g, '');
          return message.guild.members.cache.get(id) || null;
        },
        getChannel: (name) => {
          const val = interaction.options._getOption(name);
          if (!val) return null;
          const id = val.replace(/[<#>]/g, '');
          return message.guild.channels.cache.get(id) || null;
        },
        getRole: (name) => {
          const val = interaction.options._getOption(name);
          if (!val) return null;
          const id = val.replace(/[<@&>]/g, '');
          return message.guild.roles.cache.get(id) || null;
        },
        getMentionable: (name) => {
          return interaction.options.getUser(name) || interaction.options.getRole(name);
        }
      },

      reply: async (options) => {
        if (interaction.replied) throw new Error('Interaction already replied');
        interaction.replied = true;
        if (typeof options === 'string') options = { content: options };
        interaction._lastReply = await message.reply(options);
        return interaction._lastReply;
      },

      deferReply: async (options) => {
        interaction.deferred = true;
        if (options?.ephemeral) interaction.ephemeral = true;
        interaction._lastReply = await message.reply('⏳ Processing...');
        return interaction._lastReply;
      },

      editReply: async (options) => {
        if (!interaction.deferred && !interaction.replied) throw new Error('Interaction not replied or deferred');
        if (typeof options === 'string') options = { content: options };
        if (interaction._lastReply) {
          return await interaction._lastReply.edit(options);
        }
        interaction.replied = true;
        interaction._lastReply = await message.reply(options);
        return interaction._lastReply;
      },

      followUp: async (options) => {
        if (typeof options === 'string') options = { content: options };
        return await message.channel.send(options);
      }
    };

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing prefix command ${commandName}:`, error);
      const errorMessage = 'There was an error while executing this command!';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
  },
};
