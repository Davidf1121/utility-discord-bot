import { createLogger } from './Logger.js';

export class TempChannelManager {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.logger = createLogger('TempChannelManager');
    this.tempChannels = new Map();
    this.deleteTimers = new Map();
  }

  createTempChannel(guild, userId, options = {}) {
    const {
      name = `Temp Channel`,
      userLimit = this.config.tempChannelSettings.defaultUserLimit,
      bitrate = this.config.tempChannelSettings.bitrate,
      categoryId = this.config.voiceCategoryId
    } = options;

    if (!categoryId) {
      this.logger.warn('No voiceCategoryId configured');
      return null;
    }

    const category = guild.channels.cache.get(categoryId);
    if (!category) {
      this.logger.error(`Voice category not found: ${categoryId}`);
      return null;
    }

    return guild.channels.create({
      name,
      type: 2,
      parent: categoryId,
      userLimit,
      bitrate,
      permissionOverwrites: [
        {
          id: guild.id,
          allow: ['Connect', 'Speak', 'Stream', 'UseVAD', 'ViewChannel']
        },
        {
          id: userId,
          allow: ['Connect', 'Speak', 'Stream', 'UseVAD', 'ViewChannel', 'ManageChannels']
        }
      ]
    }).then(channel => {
      this.tempChannels.set(channel.id, {
        ownerId: userId,
        createdAt: Date.now()
      });
      this.logger.info(`Created temp channel ${channel.id} for user ${userId}`);
      return channel;
    }).catch(error => {
      this.logger.error('Error creating temp channel:', error);
      return null;
    });
  }

  scheduleDeletion(channel) {
    if (this.deleteTimers.has(channel.id)) {
      clearTimeout(this.deleteTimers.get(channel.id));
    }

    const delay = this.config.tempChannelSettings.deleteDelay;
    this.logger.info(`Scheduling deletion of channel ${channel.id} in ${delay}ms`);

    const timer = setTimeout(async () => {
      const channelData = this.tempChannels.get(channel.id);
      if (!channelData) return;

      const freshChannel = await this.client.channels.fetch(channel.id).catch(() => null);
      if (!freshChannel) return;

      const members = freshChannel.members.size;
      if (members === 0) {
        await this.deleteChannel(freshChannel);
      } else {
        this.logger.info(`Channel ${channel.id} has members, skipping deletion`);
        this.deleteTimers.delete(channel.id);
      }
    }, delay);

    this.deleteTimers.set(channel.id, timer);
  }

  cancelDeletion(channelId) {
    const timer = this.deleteTimers.get(channelId);
    if (timer) {
      clearTimeout(timer);
      this.deleteTimers.delete(channelId);
      this.logger.debug(`Cancelled deletion of channel ${channelId}`);
    }
  }

  async deleteChannel(channel) {
    try {
      await channel.delete('Temporary voice channel empty');
      this.tempChannels.delete(channel.id);
      this.deleteTimers.delete(channel.id);
      this.logger.info(`Deleted temp channel ${channel.id}`);
    } catch (error) {
      this.logger.error(`Error deleting channel ${channel.id}:`, error);
    }
  }

  isTempChannel(channelId) {
    return this.tempChannels.has(channelId);
  }

  getChannelOwner(channelId) {
    const data = this.tempChannels.get(channelId);
    return data ? data.ownerId : null;
  }

  canManageChannel(channelId, userId) {
    const ownerId = this.getChannelOwner(channelId);
    return ownerId === userId;
  }
}
