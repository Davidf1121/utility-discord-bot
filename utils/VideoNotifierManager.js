import { createLogger } from './Logger.js';
import { EmbedBuilder } from 'discord.js';
import Parser from 'rss-parser';
import { saveConfig } from './ConfigLoader.js';

export class VideoNotifierManager {
  constructor(client, config, configPath = null) {
    this.client = client;
    this.config = config;
    this.configPath = configPath;
    this.logger = createLogger('VideoNotifier');
    this.parser = new Parser({
      timeout: 15000,
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
        // TikTok RSS often has XML parsing issues - log at debug level to avoid spam
        if (error.message?.includes('Attribute without value') || 
            error.message?.includes('Invalid XML') ||
            error.message?.includes('Unexpected end')) {
          this.logger.debug(`TikTok RSS parsing failed for ${channelConfig.username}: ${error.message}`);
        } else {
          this.logger.error(`Error checking TikTok channel ${channelConfig.username}:`, error.message);
        }
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
        embed.setImage(thumbnail);
      }
      embed.setAuthor({
        name: channelLabel || 'YouTube',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
        url: video.link
      });
      embed.setFooter({
        text: 'YouTube',
        iconURL: 'https://www.youtube.com/favicon.ico'
      });
    } else if (platform === 'tiktok') {
      const thumbnail = this.getTikTokThumbnail(video);
      if (thumbnail) {
        embed.setImage(thumbnail);
      }
      embed.setAuthor({
        name: channelLabel || 'TikTok',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
        url: video.link
      });
      embed.setFooter({
        text: 'TikTok',
        iconURL: 'https://www.tiktok.com/favicon.ico'
      });
    }

    return embed;
  }

  getYouTubeThumbnail(video) {
    if (video.mediaThumbnail && video.mediaThumbnail.$.url) {
      return video.mediaThumbnail.$.url.replace('mqdefault', 'hqdefault');
    }
    if (video.mediaGroup && video.mediaGroup['media:thumbnail'] && video.mediaGroup['media:thumbnail'][0]) {
      return video.mediaGroup['media:thumbnail'][0].$.url.replace('mqdefault', 'hqdefault');
    }
    if (video.videoId) {
      return `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
    }
    if (video.link) {
      const videoId = this.extractYouTubeVideoId(video.link);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    return null;
  }

  getTikTokThumbnail(video) {
    if (video.mediaThumbnail && video.mediaThumbnail.$.url) {
      return video.mediaThumbnail.$.url;
    }
    if (video.mediaGroup && video.mediaGroup['media:thumbnail'] && video.mediaGroup['media:thumbnail'][0]) {
      return video.mediaGroup['media:thumbnail'][0].$.url;
    }
    
    // Check for images in content
    if (video.content) {
      const match = video.content.match(/<img[^>]+src="([^">]+)"/);
      if (match) return match[1];
    }

    // Default TikTok placeholder
    return 'https://i.imgur.com/vHdfY9S.png';
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

  validateYouTubeChannelId(channelId) {
    if (!channelId) return false;
    // YouTube channel IDs start with UC followed by 22 characters (total 24)
    const youtubeIdRegex = /^UC[a-zA-Z0-9_-]{22}$/;
    return youtubeIdRegex.test(channelId);
  }

  async validateYouTubeChannel(channelId) {
    if (!this.validateYouTubeChannelId(channelId)) {
      return {
        success: false,
        message: 'Invalid YouTube Channel ID format. Channel IDs should start with "UC" and be 24 characters long (UC + 22 characters).',
        details: 'YouTube channel IDs look like: UC_x5XG1OV2P6uZZ5FSM9Ttw. This is NOT your username or handle (@username). You can find your Channel ID in YouTube Studio > Settings > Channel > Advanced Settings.'
      };
    }

    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      this.logger.debug(`Validating YouTube channel via RSS: ${rssUrl}`);
      
      const feed = await this.parser.parseURL(rssUrl);

      if (!feed.title && !feed.items?.length) {
        return {
          success: false,
          message: 'Channel exists but has no public videos or information available.',
          details: 'The channel may be private, have no uploaded videos, or be restricted in some regions.'
        };
      }

      const latestVideo = feed.items[0];
      const channelInfo = {
        title: feed.title || 'Unknown Channel',
        author: feed.author || 'Unknown',
        link: feed.link || `https://www.youtube.com/channel/${channelId}`,
        latestVideo: latestVideo ? {
          title: latestVideo.title || 'No title',
          link: latestVideo.link || '',
          pubDate: latestVideo.pubDate || ''
        } : null
      };

      return {
        success: true,
        message: 'Channel validated successfully',
        channelInfo
      };
    } catch (error) {
      this.logger.error(`Error validating YouTube channel ${channelId}:`, error.message);
      
      // Provide specific, helpful error messages
      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Request timed out while fetching channel information.',
          details: 'YouTube RSS feed took too long to respond. This may be due to network issues or YouTube rate limiting. Please try again in a few moments.'
        };
      }
      
      if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
        return {
          success: false,
          message: 'Network error: Unable to reach YouTube.',
          details: 'Could not resolve the YouTube RSS feed URL. Please check your internet connection and try again.'
        };
      }
      
      if (error.message?.includes('404') || error.status === 404 || error.message?.includes('Status code 404')) {
        return {
          success: false,
          message: 'Channel not found.',
          details: `The channel ID "${channelId}" does not exist or is not accessible. Please verify the Channel ID is correct. You can find your Channel ID in YouTube Studio > Settings > Channel > Advanced Settings.`
        };
      }
      
      if (error.message?.includes('403') || error.status === 403) {
        return {
          success: false,
          message: 'Access denied to channel RSS feed.',
          details: 'YouTube may be blocking RSS feed access for this channel. This could be due to privacy settings or regional restrictions.'
        };
      }

      if (error.message?.includes('Invalid XML') || error.message?.includes('Unexpected end')) {
        return {
          success: false,
          message: 'Received invalid response from YouTube.',
          details: 'The RSS feed returned malformed data. This might be a temporary issue with YouTube\'s servers. Please try again later.'
        };
      }
      
      return {
        success: false,
        message: 'Failed to validate channel.',
        details: `Error: ${error.message}. Please check the channel ID and try again.`
      };
    }
  }

  async validateTikTokChannel(username) {
    if (!username || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return {
        success: false,
        message: 'Invalid TikTok username format.',
        details: 'Username should only contain letters, numbers, dots, underscores, and hyphens. Do not include the @ symbol.'
      };
    }

    try {
      // Use HTTP fetch to check if the profile page exists
      // TikTok's /rss endpoint has XML parsing issues, so we check the profile page directly
      const profileUrl = `https://www.tiktok.com/@${username}`;
      this.logger.debug(`Validating TikTok channel via profile page: ${profileUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(profileUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      clearTimeout(timeoutId);

      if (response.status === 404) {
        return {
          success: false,
          message: 'TikTok account not found.',
          details: `The username "@${username}" does not exist on TikTok. Please verify the username is spelled correctly.`
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Access denied to TikTok profile.',
          details: 'The account may be private, blocked, or restricted. TikTok may also be blocking automated access.'
        };
      }

      if (!response.ok && response.status !== 200) {
        return {
          success: false,
          message: `Received HTTP ${response.status} from TikTok.`,
          details: 'TikTok returned an unexpected response. This could be temporary. Please try again later.'
        };
      }

      // Profile page exists (200 OK or similar)
      const channelInfo = {
        title: username,
        link: profileUrl,
        latestVideo: null
      };

      return {
        success: true,
        message: 'Account validated successfully',
        channelInfo,
        note: 'Note: TikTok RSS feeds may have intermittent availability. If video notifications don\'t work immediately, the bot will retry automatically.'
      };
    } catch (error) {
      this.logger.error(`Error validating TikTok channel ${username}:`, error.message);
      
      if (error.name === 'AbortError' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          message: 'Request timed out while fetching TikTok profile.',
          details: 'TikTok took too long to respond. This may be due to network issues, rate limiting, or TikTok blocking automated requests. Please try again in a few moments.'
        };
      }
      
      if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
        return {
          success: false,
          message: 'Network error: Unable to reach TikTok.',
          details: 'Could not resolve the TikTok URL. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        message: 'Failed to validate TikTok account.',
        details: `Error: ${error.message}. Please verify the username is correct and try again.`
      };
    }
  }

  async persistConfig() {
    return saveConfig(this.config);
  }

  async addYouTubeChannel(channelId, label) {
    if (!this.config.videoNotifier.youtube.channels) {
      this.config.videoNotifier.youtube.channels = [];
    }
    
    if (!this.validateYouTubeChannelId(channelId)) {
      return { 
        success: false, 
        message: 'Invalid YouTube Channel ID format. YouTube channel IDs should start with "UC" followed by 22 characters. Example: UCxxxxxxxxxxxxxxxxxxxxxx. \n\nTip: This is NOT your username or handle (@username). You can find your Channel ID in YouTube Settings > Advanced Settings.' 
      };
    }

    const existing = this.config.videoNotifier.youtube.channels.find(
      c => c.channelId === channelId
    );
    
    if (existing) {
      return { success: false, message: 'Channel already exists' };
    }
    
    this.config.videoNotifier.youtube.channels.push({ channelId, label });
    await this.persistConfig();
    return { success: true, message: 'YouTube channel added and config saved' };
  }

  async removeYouTubeChannel(channelId) {
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
    await this.persistConfig();
    return { success: true, message: 'YouTube channel removed and config saved' };
  }

  async addTikTokChannel(username, label) {
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
    await this.persistConfig();
    return { success: true, message: 'TikTok channel added and config saved' };
  }

  async removeTikTokChannel(username) {
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
    await this.persistConfig();
    return { success: true, message: 'TikTok channel removed and config saved' };
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

  async updateConfig(newConfig) {
    this.config.videoNotifier = { ...this.config.videoNotifier, ...newConfig };
    await this.persistConfig();
    return { success: true, message: 'Config updated and saved' };
  }

  async sendTestYouTubeNotification(channelId, videoData = null) {
    const testVideo = videoData || {
      title: 'Test YouTube Video',
      link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pubDate: new Date().toISOString(),
      contentSnippet: 'This is a test YouTube notification description.',
      videoId: 'dQw4w9WgXcQ'
    };
    
    const targetChannelId = channelId || this.config.videoNotifier.notificationChannelId;
    
    if (!targetChannelId) {
      throw new Error('No notification channel configured');
    }

    const channel = await this.client.channels.fetch(targetChannelId);
    if (!channel) {
      throw new Error(`Notification channel not found: ${targetChannelId}`);
    }

    const embed = this.createEmbed(testVideo, 'youtube', 'Test Channel');
    await channel.send({ content: '🔔 **Test YouTube Notification**', embeds: [embed] });
  }

  async sendTestTikTokNotification(channelId, videoData = null) {
    const testVideo = videoData || {
      title: 'Test TikTok Video',
      link: 'https://www.tiktok.com/@test/video/1234567890',
      pubDate: new Date().toISOString(),
      contentSnippet: 'This is a test TikTok notification description.',
      guid: 'video/1234567890'
    };
    
    const targetChannelId = channelId || this.config.videoNotifier.notificationChannelId;
    
    if (!targetChannelId) {
      throw new Error('No notification channel configured');
    }

    const channel = await this.client.channels.fetch(targetChannelId);
    if (!channel) {
      throw new Error(`Notification channel not found: ${targetChannelId}`);
    }

    const embed = this.createEmbed(testVideo, 'tiktok', 'Test User');
    await channel.send({ content: '🔔 **Test TikTok Notification**', embeds: [embed] });
  }
}
