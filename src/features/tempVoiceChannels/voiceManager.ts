import {
  VoiceChannel,
  GuildMember,
  PermissionFlagsBits,
  CategoryChannel,
  ChannelType,
  Guild,
  OverwriteResolvable,
} from 'discord.js';
import { logger } from '../../utils/logger';
import { config } from '../../config/config';
import { TempVoiceChannel, VoiceChannelSettings, QualityBitrateMap } from './types';

export class VoiceChannelManager {
  private tempChannels: Map<string, TempVoiceChannel> = new Map();
  private userChannels: Map<string, string> = new Map();

  public getVoiceChannel(channelId: string): TempVoiceChannel | undefined {
    return this.tempChannels.get(channelId);
  }

  public getUserChannel(userId: string): string | undefined {
    return this.userChannels.get(userId);
  }

  public hasChannel(userId: string): boolean {
    return this.userChannels.has(userId);
  }

  public async createVoiceChannel(
    guild: Guild,
    owner: GuildMember,
    settings: VoiceChannelSettings
  ): Promise<VoiceChannel | null> {
    const featureConfig = config.features.tempVoiceChannels;

    if (this.hasChannel(owner.id)) {
      const existingChannelId = this.userChannels.get(owner.id);
      const existingChannel = guild.channels.cache.get(existingChannelId!);
      if (existingChannel) {
        throw new Error('You already have an active voice channel. Please close it first.');
      }
      this.userChannels.delete(owner.id);
    }

    const category = guild.channels.cache.get(featureConfig.voiceCategoryId) as CategoryChannel;
    if (!category || category.type !== ChannelType.GuildCategory) {
      throw new Error('Voice channel category not found. Please check the configuration.');
    }

    const channelName = settings.name.replace('{user}', owner.displayName).slice(0, 100);

    const permissionOverwrites: OverwriteResolvable[] = [
      {
        id: guild.id,
        allow: settings.locked ? [] : [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
        deny: settings.locked ? [PermissionFlagsBits.Connect] : [],
      },
      {
        id: owner.id,
        allow: [
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.MoveMembers,
          PermissionFlagsBits.MuteMembers,
          PermissionFlagsBits.DeafenMembers,
          PermissionFlagsBits.PrioritySpeaker,
        ],
      },
      {
        id: guild.client.user!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.MoveMembers,
        ],
      },
    ];

    try {
      const voiceChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category.id,
        bitrate: Math.min(settings.bitrate, guild.maximumBitrate),
        userLimit: settings.userLimit,
        permissionOverwrites,
        reason: `Temporary voice channel created by ${owner.user.tag}`,
      });

      const tempChannel: TempVoiceChannel = {
        id: voiceChannel.id,
        ownerId: owner.id,
        guildId: guild.id,
        createdAt: new Date(),
        lastEmptyAt: null,
        deleteTimeout: null,
        settings,
      };

      this.tempChannels.set(voiceChannel.id, tempChannel);
      this.userChannels.set(owner.id, voiceChannel.id);

      logger.info(`Created temp voice channel "${channelName}" (${voiceChannel.id}) for ${owner.user.tag}`);

      return voiceChannel;
    } catch (error) {
      logger.error('Failed to create voice channel:', error);
      throw new Error('Failed to create voice channel. Please try again.');
    }
  }

  public async updateChannelSettings(
    channelId: string,
    settings: Partial<VoiceChannelSettings>,
    guild: Guild
  ): Promise<void> {
    const tempChannel = this.tempChannels.get(channelId);
    if (!tempChannel) {
      throw new Error('Channel not found or is not a temporary voice channel.');
    }

    const voiceChannel = guild.channels.cache.get(channelId) as VoiceChannel;
    if (!voiceChannel) {
      this.cleanupChannel(channelId);
      throw new Error('Voice channel no longer exists.');
    }

    const newSettings = { ...tempChannel.settings, ...settings };

    try {
      const updateData: {
        name?: string;
        userLimit?: number;
        bitrate?: number;
        permissionOverwrites?: OverwriteResolvable[];
      } = {};

      if (settings.name !== undefined) {
        updateData.name = settings.name.slice(0, 100);
      }
      if (settings.userLimit !== undefined) {
        updateData.userLimit = settings.userLimit;
      }
      if (settings.bitrate !== undefined) {
        updateData.bitrate = Math.min(settings.bitrate, guild.maximumBitrate);
      }

      if (settings.locked !== undefined) {
        const ownerId = tempChannel.ownerId;
        updateData.permissionOverwrites = [
          {
            id: guild.id,
            allow: settings.locked ? [] : [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
            deny: settings.locked ? [PermissionFlagsBits.Connect] : [],
          },
          {
            id: ownerId,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
              PermissionFlagsBits.PrioritySpeaker,
            ],
          },
          {
            id: guild.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ];
      }

      await voiceChannel.edit(updateData);
      tempChannel.settings = newSettings;

      logger.info(`Updated settings for channel ${channelId}`);
    } catch (error) {
      logger.error(`Failed to update channel ${channelId}:`, error);
      throw new Error('Failed to update channel settings.');
    }
  }

  public async handleUserJoin(channel: VoiceChannel, member: GuildMember): Promise<void> {
    const tempChannel = this.tempChannels.get(channel.id);
    if (!tempChannel) return;

    if (tempChannel.deleteTimeout) {
      clearTimeout(tempChannel.deleteTimeout);
      tempChannel.deleteTimeout = null;
      tempChannel.lastEmptyAt = null;
      logger.info(`Cleared deletion timer for channel ${channel.id} - user joined`);
    }

    if (member.id === tempChannel.ownerId) {
      // Owner joined - ensure they have proper permissions
      try {
        await channel.permissionOverwrites.edit(member.id, {
          Connect: true,
          ViewChannel: true,
          ManageChannels: true,
          MoveMembers: true,
          MuteMembers: true,
          DeafenMembers: true,
          PrioritySpeaker: true,
        });
      } catch (error) {
        logger.error(`Failed to update owner permissions in ${channel.id}:`, error);
      }
    }
  }

  public async handleUserLeave(channel: VoiceChannel, member: GuildMember): Promise<void> {
    const tempChannel = this.tempChannels.get(channel.id);
    if (!tempChannel) return;

    const memberCount = channel.members.size;

    if (memberCount === 0) {
      tempChannel.lastEmptyAt = new Date();
      const timeout = config.features.tempVoiceChannels.cleanup.emptyChannelTimeoutMs;

      logger.info(`Channel ${channel.id} is empty, scheduling deletion in ${timeout}ms`);

      tempChannel.deleteTimeout = setTimeout(async () => {
        await this.deleteChannel(channel.id, channel.guild);
      }, timeout);
    }
  }

  public async deleteChannel(channelId: string, guild: Guild, reason = 'Temporary channel cleanup'): Promise<void> {
    const tempChannel = this.tempChannels.get(channelId);
    if (!tempChannel) return;

    const voiceChannel = guild.channels.cache.get(channelId) as VoiceChannel;

    if (voiceChannel) {
      try {
        await voiceChannel.delete(reason);
        logger.info(`Deleted voice channel ${channelId}: ${reason}`);
      } catch (error) {
        logger.error(`Failed to delete channel ${channelId}:`, error);
      }
    }

    this.cleanupChannel(channelId);
  }

  public cleanupChannel(channelId: string): void {
    const tempChannel = this.tempChannels.get(channelId);
    if (tempChannel) {
      if (tempChannel.deleteTimeout) {
        clearTimeout(tempChannel.deleteTimeout);
      }
      this.userChannels.delete(tempChannel.ownerId);
      this.tempChannels.delete(channelId);
      logger.info(`Cleaned up channel data for ${channelId}`);
    }
  }

  public async transferOwnership(channelId: string, newOwnerId: string, guild: Guild): Promise<void> {
    const tempChannel = this.tempChannels.get(channelId);
    if (!tempChannel) {
      throw new Error('Channel not found or is not a temporary voice channel.');
    }

    const voiceChannel = guild.channels.cache.get(channelId) as VoiceChannel;
    if (!voiceChannel) {
      this.cleanupChannel(channelId);
      throw new Error('Voice channel no longer exists.');
    }

    const oldOwnerId = tempChannel.ownerId;

    try {
      await voiceChannel.permissionOverwrites.delete(oldOwnerId);
      await voiceChannel.permissionOverwrites.edit(newOwnerId, {
        Connect: true,
        ViewChannel: true,
        ManageChannels: true,
        MoveMembers: true,
        MuteMembers: true,
        DeafenMembers: true,
        PrioritySpeaker: true,
      });

      this.userChannels.delete(oldOwnerId);
      this.userChannels.set(newOwnerId, channelId);
      tempChannel.ownerId = newOwnerId;

      const newName = tempChannel.settings.name.replace(/[^']+/, (match) => {
        if (match.includes('Channel')) return match;
        return "{user}'s Channel";
      });

      const newMember = guild.members.cache.get(newOwnerId);
      if (newMember) {
        const finalName = newName.replace('{user}', newMember.displayName).slice(0, 100);
        await voiceChannel.setName(finalName);
        tempChannel.settings.name = newName;
      }

      logger.info(`Transferred ownership of ${channelId} from ${oldOwnerId} to ${newOwnerId}`);
    } catch (error) {
      logger.error(`Failed to transfer ownership for ${channelId}:`, error);
      throw new Error('Failed to transfer channel ownership.');
    }
  }

  public isTempChannel(channelId: string): boolean {
    return this.tempChannels.has(channelId);
  }

  public getChannelOwner(channelId: string): string | undefined {
    return this.tempChannels.get(channelId)?.ownerId;
  }
}

export const voiceManager = new VoiceChannelManager();
