import {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ChannelType,
  GuildMember,
  VoiceChannel,
  PermissionsBitField,
} from 'discord.js';
import { logger } from '../../utils/logger';
import { voiceManager } from './voiceManager';
import {
  CREATE_BUTTON_ID,
  EDIT_BUTTON_ID,
  DELETE_BUTTON_ID,
  LOCK_BUTTON_ID,
  TRANSFER_BUTTON_ID,
  CREATE_MODAL_ID,
  EDIT_MODAL_ID,
  QUALITY_SELECT_ID,
  createCreateModal,
  createEditModal,
  createChannelControlButtons,
  handleChannelCreation,
} from './setup';
import { QualityBitrateMap } from './types';

export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const { customId, member, guild } = interaction;

  if (!guild || !(member instanceof GuildMember)) {
    await interaction.reply({
      content: 'This interaction can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  try {
    switch (customId) {
      case CREATE_BUTTON_ID:
        await handleCreateButton(interaction);
        break;
      case EDIT_BUTTON_ID:
        await handleEditButton(interaction);
        break;
      case DELETE_BUTTON_ID:
        await handleDeleteButton(interaction);
        break;
      case LOCK_BUTTON_ID:
        await handleLockButton(interaction);
        break;
      case TRANSFER_BUTTON_ID:
        await handleTransferButton(interaction);
        break;
      default:
        if (customId.startsWith('tempvc:transfer:')) {
          await handleTransferSelect(interaction);
        }
    }
  } catch (error) {
    logger.error(`Error handling button interaction ${customId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
    }
  }
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  const { customId, member, guild } = interaction;

  if (!guild || !(member instanceof GuildMember)) {
    await interaction.reply({
      content: 'This interaction can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  try {
    if (customId === CREATE_MODAL_ID) {
      await handleCreateModalSubmit(interaction);
    } else if (customId === EDIT_MODAL_ID) {
      await handleEditModalSubmit(interaction);
    }
  } catch (error) {
    logger.error(`Error handling modal submit ${customId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
    }
  }
}

export async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction): Promise<void> {
  const { customId, member, guild } = interaction;

  if (!guild || !(member instanceof GuildMember)) {
    await interaction.reply({
      content: 'This interaction can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  try {
    if (customId === QUALITY_SELECT_ID) {
      await handleQualitySelect(interaction);
    }
  } catch (error) {
    logger.error(`Error handling select menu ${customId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
    }
  }
}

async function handleCreateButton(interaction: ButtonInteraction): Promise<void> {
  const modal = createCreateModal();
  await interaction.showModal(modal);
}

async function handleCreateModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const name = interaction.fields.getTextInputValue('channel_name');
  const limitStr = interaction.fields.getTextInputValue('user_limit');
  const lockedStr = interaction.fields.getTextInputValue('locked').toLowerCase();

  const userLimit = parseInt(limitStr, 10);
  if (isNaN(userLimit) || userLimit < 1 || userLimit > 99) {
    await interaction.editReply({
      content: '❌ Invalid user limit. Please enter a number between 1 and 99.',
    });
    return;
  }

  const locked = lockedStr === 'yes' || lockedStr === 'y';

  const channelMention = await handleChannelCreation(
    interaction.member as GuildMember,
    name,
    userLimit,
    'normal',
    locked
  );

  await interaction.editReply({
    content: `✅ Voice channel created! Join ${channelMention} to start chatting.`,
  });
}

async function handleEditButton(interaction: ButtonInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel as VoiceChannel | null;

  if (!voiceChannel) {
    await interaction.reply({
      content: '❌ You must be in a voice channel to use this button.',
      ephemeral: true,
    });
    return;
  }

  if (!voiceManager.isTempChannel(voiceChannel.id)) {
    await interaction.reply({
      content: '❌ This is not a temporary voice channel.',
      ephemeral: true,
    });
    return;
  }

  const ownerId = voiceManager.getChannelOwner(voiceChannel.id);
  if (member.id !== ownerId) {
    await interaction.reply({
      content: '❌ Only the channel owner can edit the channel.',
      ephemeral: true,
    });
    return;
  }

  const tempChannel = voiceManager.getVoiceChannel(voiceChannel.id);
  const modal = createEditModal(
    tempChannel?.settings.name || voiceChannel.name,
    tempChannel?.settings.userLimit || voiceChannel.userLimit || 10
  );

  await interaction.showModal(modal);
}

async function handleEditModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel as VoiceChannel | null;

  if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
    await interaction.editReply({
      content: '❌ You are no longer in a temporary voice channel.',
    });
    return;
  }

  const name = interaction.fields.getTextInputValue('edit_name');
  const limitStr = interaction.fields.getTextInputValue('edit_limit');

  const userLimit = parseInt(limitStr, 10);
  if (isNaN(userLimit) || userLimit < 1 || userLimit > 99) {
    await interaction.editReply({
      content: '❌ Invalid user limit. Please enter a number between 1 and 99.',
    });
    return;
  }

  await voiceManager.updateChannelSettings(
    voiceChannel.id,
    { name, userLimit },
    interaction.guild!
  );

  await interaction.editReply({
    content: `✅ Channel updated! Name: "${name}", Max players: ${userLimit}`,
  });
}

async function handleDeleteButton(interaction: ButtonInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel as VoiceChannel | null;

  if (!voiceChannel) {
    await interaction.reply({
      content: '❌ You must be in a voice channel to use this button.',
      ephemeral: true,
    });
    return;
  }

  if (!voiceManager.isTempChannel(voiceChannel.id)) {
    await interaction.reply({
      content: '❌ This is not a temporary voice channel.',
      ephemeral: true,
    });
    return;
  }

  const ownerId = voiceManager.getChannelOwner(voiceChannel.id);
  if (member.id !== ownerId) {
    await interaction.reply({
      content: '❌ Only the channel owner can delete the channel.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  await voiceManager.deleteChannel(voiceChannel.id, interaction.guild!, 'Owner requested deletion');

  await interaction.editReply({
    content: '✅ Voice channel deleted.',
  });
}

async function handleLockButton(interaction: ButtonInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel as VoiceChannel | null;

  if (!voiceChannel) {
    await interaction.reply({
      content: '❌ You must be in a voice channel to use this button.',
      ephemeral: true,
    });
    return;
  }

  if (!voiceManager.isTempChannel(voiceChannel.id)) {
    await interaction.reply({
      content: '❌ This is not a temporary voice channel.',
      ephemeral: true,
    });
    return;
  }

  const ownerId = voiceManager.getChannelOwner(voiceChannel.id);
  if (member.id !== ownerId) {
    await interaction.reply({
      content: '❌ Only the channel owner can lock/unlock the channel.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const tempChannel = voiceManager.getVoiceChannel(voiceChannel.id);
  const newLockedState = !tempChannel?.settings.locked;

  await voiceManager.updateChannelSettings(
    voiceChannel.id,
    { locked: newLockedState },
    interaction.guild!
  );

  await interaction.editReply({
    content: newLockedState
      ? '🔒 Channel is now locked. Only invited users can join.'
      : '🔓 Channel is now unlocked. Anyone can join.',
  });
}

async function handleTransferButton(interaction: ButtonInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel as VoiceChannel | null;

  if (!voiceChannel) {
    await interaction.reply({
      content: '❌ You must be in a voice channel to use this button.',
      ephemeral: true,
    });
    return;
  }

  if (!voiceManager.isTempChannel(voiceChannel.id)) {
    await interaction.reply({
      content: '❌ This is not a temporary voice channel.',
      ephemeral: true,
    });
    return;
  }

  const ownerId = voiceManager.getChannelOwner(voiceChannel.id);
  if (member.id !== ownerId) {
    await interaction.reply({
      content: '❌ Only the channel owner can transfer ownership.',
      ephemeral: true,
    });
    return;
  }

  const otherMembers = voiceChannel.members.filter((m) => m.id !== member.id);

  if (otherMembers.size === 0) {
    await interaction.reply({
      content: '❌ There are no other members in the channel to transfer ownership to.',
      ephemeral: true,
    });
    return;
  }

  const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = await import('discord.js');

  const options = otherMembers.map((m) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(m.displayName)
      .setValue(m.id)
      .setDescription(`Transfer ownership to ${m.user.tag}`)
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId(`tempvc:transfer:${voiceChannel.id}`)
    .setPlaceholder('Select new owner')
    .addOptions(...options.slice(0, 25));

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: '👑 Select the new channel owner:',
    components: [row],
    ephemeral: true,
  });
}

async function handleTransferSelect(interaction: ButtonInteraction): Promise<void> {
  const newOwnerId = interaction.customId.split(':')[2];
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel as VoiceChannel | null;

  if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
    await interaction.update({
      content: '❌ Voice channel no longer exists.',
      components: [],
    });
    return;
  }

  await interaction.deferUpdate();

  await voiceManager.transferOwnership(voiceChannel.id, newOwnerId, interaction.guild!);

  const newOwner = voiceChannel.members.get(newOwnerId);
  await interaction.editReply({
    content: `✅ Channel ownership transferred to ${newOwner?.displayName || 'the new owner'}.`,
    components: [],
  });
}

async function handleQualitySelect(interaction: StringSelectMenuInteraction): Promise<void> {
  await interaction.reply({
    content: 'Quality selection is now configured in the creation modal.',
    ephemeral: true,
  });
}

export async function handleVoiceStateUpdate(
  oldMember: any,
  newMember: any,
  oldState: { channelId?: string | null },
  newState: { channelId?: string | null },
  guild: any
): Promise<void> {
  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;

  if (oldChannelId === newChannelId) return;

  if (oldChannelId && voiceManager.isTempChannel(oldChannelId)) {
    const oldChannel = guild.channels.cache.get(oldChannelId) as VoiceChannel;
    if (oldChannel) {
      await voiceManager.handleUserLeave(oldChannel, oldMember);
    }
  }

  if (newChannelId && voiceManager.isTempChannel(newChannelId)) {
    const newChannel = guild.channels.cache.get(newChannelId) as VoiceChannel;
    if (newChannel) {
      await voiceManager.handleUserJoin(newChannel, newMember);

      // Send control message if this is the first user joining after creation
      const tempChannel = voiceManager.getVoiceChannel(newChannelId);
      if (tempChannel && newMember.id === tempChannel.ownerId) {
        // Only send if we haven't sent one yet (check message history or use a flag)
        // For simplicity, we skip this in the initial implementation
      }
    }
  }
}
