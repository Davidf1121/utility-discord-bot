import { createLogger } from './Logger.js';
import { EmbedBuilder } from 'discord.js';
import Parser from 'rss-parser';

export class VideoNotifierManager {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.logger = createLogger('VideoNotifier');
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        item: [
          ['media:group', 'mediaGroup'],
          ['media:thumbnail', 'mediaThumbnail'],
          ['yt:videoId', 'videoId']
        ]
      }
    });
    this.lastVideos = new Map();
    this.pollingInterval = null;
  }

  start() {
    if (!this.config.videoNotifier?.enabled) {
      this.logger.info('Video notifier is disabled in config');
      return;
    }

    const interval = this.config.videoNotifier.checkInterval || 300000;
    this.logger.info(`Starting video notifier (checking every ${interval}ms)`);

    this.checkForNewVideos();
    this.pollingInterval = setInterval(() => {
      this.checkForNewVideos();
    }, interval);
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.logger.info('Stopped video notifier');
    }
  }

  async checkForNewVideos() {
    try {
      if (this.config.videoNotifier?.youtube?.enabled) {
        await this.checkYouTubeChannels();
      }
      if (this.config.videoNotifier?.tiktok?.enabled) {
        await this.checkTikTokChannels();
      }
    } catch (error) {
      this.logger.error('Error checking for new videos:', error);
    }
  }

  async checkYouTubeChannels() {
    const channels = this.config.videoNotifier.youtube.channels || [];
    
    for (const channelConfig of channels) {
      try {
        const { channelId, label } = channelConfig;
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        
        this.logger.debug(`Checking YouTube channel: ${label || channelId}`);
        
        const feed = await this.parser.parseURL(rssUrl);
        
        if (feed.items && feed.items.length > 0) {
          const latestVideo = feed.items[0];
          const videoId = this.extractYouTubeVideoId(latestVideo.link);
          
          if (videoId) {
            const lastKnownId = this.lastVideos.get(`youtube:${channelId}`);
            
            if (lastKnownId !== videoId) {
              this.logger.info(`New video detected from ${label || channelId}: ${latestVideo.title}`);
              await this.sendVideoNotification(latestVideo, 'youtube', label || channelId);
              this.lastVideos.set(`youtube:${channelId}`, videoId);
            } else {
              this.logger.debug(`No new videos from ${label || channelId}`);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error checking YouTube channel ${channelConfig.channelId}:`, error.message);
      }
    }
  }

  async checkTikTokChannels() {
    const channels = this.config.videoNotifier.tiktok.channels || [];
    
    for (const channelConfig of channels) {
      try {
        const { username, label } = channelConfig;
        this.logger.debug(`Checking TikTok channel: ${label || username}`);
        
        const rssUrl = `https://www.tiktok.com/@${username}/rss`;
        const feed = await this.parser.parseURL(rssUrl);
        
        if (feed.items && feed.items.length > 0) {
          const latestVideo = feed.items[0];
          const videoId = this.extractTikTokVideoId(latestVideo.guid);
          
          if (videoId) {
            const lastKnownId = this.lastVideos.get(`tiktok:${username}`);
            
            if (lastKnownId !== videoId) {
              this.logger.info(`New TikTok detected from ${label || username}: ${latestVideo.title}`);
              await this.sendVideoNotification(latestVideo, 'tiktok', label || username);
              this.lastVideos.set(`tiktok:${username}`, videoId);
            } else {
              this.logger.debug(`No new TikToks from ${label || username}`);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error checking TikTok channel ${channelConfig.username}:`, error.message);
      }
    }
  }

  async sendVideoNotification(video, platform, channelLabel) {
    const channelId = this.config.videoNotifier.notificationChannelId;
    
    if (!channelId) {
      this.logger.warn('No notification channel configured, skipping notification');
      return;
    }

    const channel = this.client.channels.cache.get(channelId);
    if (!channel) {
      this.logger.warn(`Notification channel not found: ${channelId}`);
      return;
    }

    const embed = this.createEmbed(video, platform, channelLabel);
    
    try {
      await channel.send({ embeds: [embed] });
      this.logger.info(`Sent notification for ${platform} video: ${video.title}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
    }
  }

  createEmbed(video, platform, channelLabel) {
    const embedColor = platform === 'youtube' 
      ? this.config.embedColors.primary 
      : 0x000000;
    
    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(video.title)
      .setURL(video.link)
      .setTimestamp(new Date(video.pubDate));

    const includeDescription = this.config.videoNotifier.embedSettings?.includeDescription ?? true;
    const descriptionLength = this.config.videoNotifier.embedSettings?.descriptionLength ?? 200;

    if (includeDescription && video.contentSnippet) {
      const description = video.contentSnippet.substring(0, descriptionLength);
      embed.setDescription(description + (video.contentSnippet.length > descriptionLength ? '...' : ''));
    }

    if (platform === 'youtube') {
      const thumbnail = this.getYouTubeThumbnail(video);
      if (thumbnail) {
        embed.setThumbnail(thumbnail);
      }
      embed.setAuthor({
        name: channelLabel || 'YouTube',
        iconURL: 'https://www.youtube.com/favicon.ico'
      });
    } else if (platform === 'tiktok') {
      embed.setAuthor({
        name: channelLabel || 'TikTok',
        iconURL: 'https://www.tiktok.com/favicon.ico'
      });
    }

    return embed;
  }

  getYouTubeThumbnail(video) {
    if (video.mediaThumbnail && video.mediaThumbnail.$.url) {
      return video.mediaThumbnail.$.url;
    }
    if (video.mediaGroup && video.mediaGroup['media:thumbnail'] && video.mediaGroup['media:thumbnail'][0]) {
      return video.mediaGroup['media:thumbnail'][0].$.url;
    }
    if (video.videoId) {
      return `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
    }
    if (video.link) {
      const videoId = this.extractYouTubeVideoId(video.link);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    return null;
  }

  extractYouTubeVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  extractTikTokVideoId(guid) {
    if (typeof guid === 'string') {
      const match = guid.match(/video\/(\d+)/);
      return match ? match[1] : guid;
    }
    return guid;
  }

  addYouTubeChannel(channelId, label) {
    if (!this.config.videoNotifier.youtube.channels) {
      this.config.videoNotifier.youtube.channels = [];
    }
    
    const existing = this.config.videoNotifier.youtube.channels.find(
      c => c.channelId === channelId
    );
    
    if (existing) {
      return { success: false, message: 'Channel already exists' };
    }
    
    this.config.videoNotifier.youtube.channels.push({ channelId, label });
    return { success: true, message: 'YouTube channel added' };
  }

  removeYouTubeChannel(channelId) {
    if (!this.config.videoNotifier.youtube.channels) {
      return { success: false, message: 'No channels configured' };
    }
    
    const index = this.config.videoNotifier.youtube.channels.findIndex(
      c => c.channelId === channelId
    );
    
    if (index === -1) {
      return { success: false, message: 'Channel not found' };
    }
    
    this.config.videoNotifier.youtube.channels.splice(index, 1);
    return { success: true, message: 'YouTube channel removed' };
  }

  addTikTokChannel(username, label) {
    if (!this.config.videoNotifier.tiktok.channels) {
      this.config.videoNotifier.tiktok.channels = [];
    }
    
    const existing = this.config.videoNotifier.tiktok.channels.find(
      c => c.username === username
    );
    
    if (existing) {
      return { success: false, message: 'Channel already exists' };
    }
    
    this.config.videoNotifier.tiktok.channels.push({ username, label });
    return { success: true, message: 'TikTok channel added' };
  }

  removeTikTokChannel(username) {
    if (!this.config.videoNotifier.tiktok.channels) {
      return { success: false, message: 'No channels configured' };
    }
    
    const index = this.config.videoNotifier.tiktok.channels.findIndex(
      c => c.username === username
    );
    
    if (index === -1) {
      return { success: false, message: 'Channel not found' };
    }
    
    this.config.videoNotifier.tiktok.channels.splice(index, 1);
    return { success: true, message: 'TikTok channel removed' };
  }

  listChannels() {
    const youtube = this.config.videoNotifier.youtube?.channels || [];
    const tiktok = this.config.videoNotifier.tiktok?.channels || [];
    
    return {
      youtube: youtube.map(c => ({
        id: c.channelId,
        label: c.label
      })),
      tiktok: tiktok.map(c => ({
        username: c.username,
        label: c.label
      }))
    };
  }

  updateConfig(newConfig) {
    this.config.videoNotifier = { ...this.config.videoNotifier, ...newConfig };
    return { success: true, message: 'Config updated' };
  }
}
