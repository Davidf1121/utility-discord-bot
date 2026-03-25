import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup the temporary voice channel system')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('control')
      .setDescription('Set the control channel where users can create voice channels')
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription('The text channel for the control message')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('category')
      .setDescription('Set the category where temporary voice channels will be created')
      .addChannelOption((option) =>
        option
          .setName('category')
          .setDescription('The category for voice channels')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildCategory)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('status').setDescription('Check the current setup status')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'control':
      await handleControlSetup(interaction);
      break;
    case 'category':
      await handleCategorySetup(interaction);
      break;
    case 'status':
      await handleStatusCheck(interaction);
      break;
    default:
      await interaction.editReply({
        content: '❌ Unknown subcommand',
      });
  }
}

async function handleControlSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.options.getChannel('channel', true);

  if (channel.type !== ChannelType.GuildText) {
    await interaction.editReply({
      content: '❌ Please select a text channel',
    });
    return;
  }

  try {
    // Update config
    config.features.tempVoiceChannels.controlChannelId = channel.id;
    saveConfig();

    // Post control message
    const { setupControlChannel } = await import('../features/tempVoiceChannels/setup');
    await setupControlChannel(interaction.client);

    await interaction.editReply({
      content: `✅ Control channel set to <#${channel.id}> and control message posted!`,
    });

    logger.info(`Control channel set to ${channel.id} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error('Failed to set control channel:', error);
    await interaction.editReply({
      content: '❌ Failed to set control channel. Please check bot permissions.',
    });
  }
}

async function handleCategorySetup(interaction: ChatInputCommandInteraction): Promise<void> {
  const category = interaction.options.getChannel('category', true);

  if (category.type !== ChannelType.GuildCategory) {
    await interaction.editReply({
      content: '❌ Please select a category',
    });
    return;
  }

  try {
    config.features.tempVoiceChannels.voiceCategoryId = category.id;
    saveConfig();

    await interaction.editReply({
      content: `✅ Voice channel category set to **${category.name}**!`,
    });

    logger.info(`Voice category set to ${category.id} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error('Failed to set voice category:', error);
    await interaction.editReply({
      content: '❌ Failed to set voice category.',
    });
  }
}

async function handleStatusCheck(interaction: ChatInputCommandInteraction): Promise<void> {
  const { guild } = interaction;
  const featureConfig = config.features.tempVoiceChannels;

  const controlChannel = featureConfig.controlChannelId
    ? guild?.channels.cache.get(featureConfig.controlChannelId)
    : null;

  const voiceCategory = featureConfig.voiceCategoryId
    ? guild?.channels.cache.get(featureConfig.voiceCategoryId)
    : null;

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Bot Setup Status')
    .setColor(controlChannel && voiceCategory ? 0x00ff00 : 0xffa500)
    .addFields(
      {
        name: 'Control Channel',
        value: controlChannel
          ? `✅ Set: <#${controlChannel.id}>`
          : '❌ Not configured\nUse `/setup control` to set it',
        inline: true,
      },
      {
        name: 'Voice Category',
        value: voiceCategory
          ? `✅ Set: **${voiceCategory.name}**`
          : '❌ Not configured\nUse `/setup category` to set it',
        inline: true,
      },
      {
        name: 'Default Settings',
        value:
          `Name: \`${featureConfig.defaultSettings.name}\`\n` +
          `Max Players: \`${featureConfig.defaultSettings.userLimit}\`\n` +
          `Bitrate: \`${featureConfig.defaultSettings.bitrate / 1000} kbps\`\n` +
          `Locked by default: \`${featureConfig.defaultSettings.locked ? 'Yes' : 'No'}\``,
      }
    )
    .setTimestamp();

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (!controlChannel || !voiceCategory) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Documentation')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/Davidf1121/utility-discord-bot#readme')
    );
    components.push(row);
  }

  await interaction.editReply({
    embeds: [embed],
    components: components.length > 0 ? components : undefined,
  });
}

function saveConfig(): void {
  try {
    const configPath = resolve(process.cwd(), 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    logger.error('Failed to save config:', error);
    throw new Error('Failed to save configuration');
  }
}
