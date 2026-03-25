import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import { voiceManager } from './voiceManager';
import { QualityBitrateMap } from './types';

const CREATE_BUTTON_ID = 'tempvc:create';
const EDIT_BUTTON_ID = 'tempvc:edit';
const DELETE_BUTTON_ID = 'tempvc:delete';
const LOCK_BUTTON_ID = 'tempvc:lock';
const TRANSFER_BUTTON_ID = 'tempvc:transfer';
const CREATE_MODAL_ID = 'tempvc:modal:create';
const EDIT_MODAL_ID = 'tempvc:modal:edit';
const QUALITY_SELECT_ID = 'tempvc:select:quality';

export { CREATE_BUTTON_ID, EDIT_BUTTON_ID, DELETE_BUTTON_ID, LOCK_BUTTON_ID, TRANSFER_BUTTON_ID };
export { CREATE_MODAL_ID, EDIT_MODAL_ID, QUALITY_SELECT_ID };

export async function setupControlChannel(client: any): Promise<void> {
  const featureConfig = config.features.tempVoiceChannels;

  if (!featureConfig.controlChannelId) {
    logger.warn('Temp voice channels feature is enabled but controlChannelId is not set in config.json');
    logger.info('Please set controlChannelId in config.json and restart the bot');
    return;
  }

  try {
    const channel = await client.channels.fetch(featureConfig.controlChannelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      logger.error(`Control channel ${featureConfig.controlChannelId} not found or is not a text channel`);
      return;
    }

    const textChannel = channel as TextChannel;

    const hasPermissions = textChannel.guild.members.me?.permissions.has([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
    ]);

    if (!hasPermissions) {
      logger.error(`Bot lacks required permissions in control channel ${featureConfig.controlChannelId}`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(featureConfig.ui.embedTitle)
      .setDescription(featureConfig.ui.embedDescription)
      .setColor(featureConfig.ui.embedColor)
      .setTimestamp()
      .setFooter({ text: config.bot.name })
      .addFields(
        {
          name: '🎛️ Configuration Options',
          value:
            '• **Channel Name** - Custom name for your voice channel\n' +
            '• **Max Players** - Limit how many users can join (1-99)\n' +
            '• **Quality** - Audio quality setting\n' +
            '• **Lock** - Start locked (only invited users can join)',
        },
        {
          name: '🔧 Channel Controls',
          value:
            'Once created, use buttons in your channel to:\n' +
            '• Edit settings • Lock/Unlock • Delete • Transfer ownership',
        }
      );

    const button = new ButtonBuilder()
      .setCustomId(CREATE_BUTTON_ID)
      .setLabel(featureConfig.ui.buttonLabel)
      .setEmoji(featureConfig.ui.buttonEmoji)
      .setStyle(
        featureConfig.ui.buttonStyle === 'Primary'
          ? ButtonStyle.Primary
          : featureConfig.ui.buttonStyle === 'Secondary'
          ? ButtonStyle.Secondary
          : featureConfig.ui.buttonStyle === 'Success'
          ? ButtonStyle.Success
          : ButtonStyle.Danger
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const messages = await textChannel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(
      (m) => m.author.id === client.user?.id && m.embeds.length > 0
    );

    if (botMessages.size > 0) {
      const lastMessage = botMessages.first();
      if (lastMessage) {
        await lastMessage.edit({ embeds: [embed], components: [row] });
        logger.info('Updated existing control message');
        return;
      }
    }

    await textChannel.send({ embeds: [embed], components: [row] });
    logger.info('Posted new control message to channel');
  } catch (error) {
    logger.error('Failed to setup control channel:', error);
  }
}

export function createCreateModal(): ModalBuilder {
  const featureConfig = config.features.tempVoiceChannels;
  const defaults = featureConfig.defaultSettings;

  const modal = new ModalBuilder()
    .setCustomId(CREATE_MODAL_ID)
    .setTitle('Create Voice Channel');

  const nameInput = new TextInputBuilder()
    .setCustomId('channel_name')
    .setLabel('Channel Name')
    .setPlaceholder("{user}'s Channel")
    .setValue(defaults.name.includes('{user}') ? "My Voice Channel" : defaults.name)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(100);

  const limitInput = new TextInputBuilder()
    .setCustomId('user_limit')
    .setLabel('Max Players (1-99)')
    .setPlaceholder(String(defaults.userLimit))
    .setValue(String(defaults.userLimit))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(2);

  const lockInput = new TextInputBuilder()
    .setCustomId('locked')
    .setLabel('Locked? (yes/no)')
    .setPlaceholder(defaults.locked ? 'yes' : 'no')
    .setValue(defaults.locked ? 'no' : 'no')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(3);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(limitInput);
  const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(lockInput);

  modal.addComponents(row1, row2, row3);

  return modal;
}

export function createQualitySelectMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
  const select = new StringSelectMenuBuilder()
    .setCustomId(QUALITY_SELECT_ID)
    .setPlaceholder('Select audio quality')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Low (64 kbps)')
        .setValue('low')
        .setDescription('Good for slow connections')
        .setEmoji('🔉'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Normal (96 kbps)')
        .setValue('normal')
        .setDescription('Standard quality')
        .setEmoji('🔊')
        .setDefault(true),
      new StringSelectMenuOptionBuilder()
        .setLabel('High (128 kbps)')
        .setValue('high')
        .setDescription('Best audio quality')
        .setEmoji('🎵')
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function createEditModal(currentName: string, currentLimit: number): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(EDIT_MODAL_ID)
    .setTitle('Edit Voice Channel');

  const nameInput = new TextInputBuilder()
    .setCustomId('edit_name')
    .setLabel('Channel Name')
    .setValue(currentName)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(100);

  const limitInput = new TextInputBuilder()
    .setCustomId('edit_limit')
    .setLabel('Max Players (1-99)')
    .setValue(String(currentLimit))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(2);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(limitInput);

  modal.addComponents(row1, row2);

  return modal;
}

export function createChannelControlButtons(isLocked: boolean): ActionRowBuilder<ButtonBuilder> {
  const editButton = new ButtonBuilder()
    .setCustomId(EDIT_BUTTON_ID)
    .setLabel('Edit')
    .setEmoji('⚙️')
    .setStyle(ButtonStyle.Secondary);

  const lockButton = new ButtonBuilder()
    .setCustomId(LOCK_BUTTON_ID)
    .setLabel(isLocked ? 'Unlock' : 'Lock')
    .setEmoji(isLocked ? '🔓' : '🔒')
    .setStyle(isLocked ? ButtonStyle.Success : ButtonStyle.Primary);

  const transferButton = new ButtonBuilder()
    .setCustomId(TRANSFER_BUTTON_ID)
    .setLabel('Transfer')
    .setEmoji('👑')
    .setStyle(ButtonStyle.Secondary);

  const deleteButton = new ButtonBuilder()
    .setCustomId(DELETE_BUTTON_ID)
    .setLabel('Delete')
    .setEmoji('🗑️')
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    editButton,
    lockButton,
    transferButton,
    deleteButton
  );
}

export async function handleChannelCreation(
  member: GuildMember,
  name: string,
  userLimit: number,
  quality: keyof typeof QualityBitrateMap,
  locked: boolean
): Promise<string> {
  const settings = {
    name,
    userLimit,
    bitrate: QualityBitrateMap[quality],
    locked,
  };

  const channel = await voiceManager.createVoiceChannel(member.guild, member, settings);

  if (!channel) {
    throw new Error('Failed to create voice channel');
  }

  return `<#${channel.id}>`;
}
