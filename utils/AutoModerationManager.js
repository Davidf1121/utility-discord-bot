import { createLogger } from './Logger.js';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { getDefaultThumbnail, getMessageStyle } from './ConfigLoader.js';
import { ComponentBuilder } from './ComponentBuilder.js';

export class AutoModerationManager {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.logger = createLogger('AutoModerationManager');
    this.messageCache = new Map(); // userId -> [{ timestamp, content, id }]
    this.notifiedNewAccounts = new Set(); // To avoid spamming warnings for new accounts
  }

  async handleMessage(message) {
    if (!message || !message.guild || message.author.bot || !message.member) return;
    
    // Check if auto-moderation feature is enabled globally and for this guild
    if (!this.config.features?.autoModeration || !this.config.autoModeration?.enabled) return;

    // Skip administrators and members with Manage Messages permission
    try {
      if (message.member.permissions.has(PermissionsBitField.Flags.Administrator) || 
          message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return;
      }
    } catch (error) {
      this.logger.error('Error checking permissions:', error);
    }

    const { triggers } = this.config.autoModeration;
    if (!triggers) return;

    // 1. Mass Mention Detection
    if (triggers.massMention?.enabled) {
      const mentionCount = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
      if (mentionCount >= triggers.massMention.threshold) {
        await this.takeAction(message, 'massMention', `Mass mentions detected (${mentionCount} mentions)`);
        return;
      }
    }

    // 2. Link Spam Detection
    if (triggers.linkSpam?.enabled) {
      const links = message.content.match(/https?:\/\/[^\s]+/g) || [];
      if (links.length >= triggers.linkSpam.maxLinks) {
        await this.takeAction(message, 'linkSpam', `Link spam detected (${links.length} links)`);
        return;
      }
    }

    // 3. Scammer Detection (Basic)
    if (triggers.scammerDetection?.enabled) {
      const accountAgeDays = (Date.now() - message.author.createdTimestamp) / (1000 * 60 * 60 * 24);
      const hasNoAvatar = !message.author.avatar;
      
      if (accountAgeDays < triggers.scammerDetection.maxAccountAgeDays) {
        if (!triggers.scammerDetection.noAvatarRequired || hasNoAvatar) {
          const scamKeywords = ['nitro', 'free', 'gift', 'steam', 'crypto', 'airdrop', 'giveaway'];
          const lowerContent = message.content.toLowerCase();
          if (scamKeywords.some(kw => lowerContent.includes(kw))) {
            await this.takeAction(message, 'scammerDetection', 'Potential scammer detected (New account, suspicious keywords)');
            return;
          }
        }
      }
    }

    // 4. Message Spam Detection
    if (triggers.messageSpam?.enabled) {
      this.trackMessage(message);
      if (this.isSpamming(message.author.id)) {
        await this.takeAction(message, 'messageSpam', 'Message spam detected');
        return;
      }
    }

    // 5. New Account Detection (Standalone)
    if (triggers.newAccount?.enabled && !this.notifiedNewAccounts.has(message.author.id)) {
      const accountAgeDays = (Date.now() - message.author.createdTimestamp) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < triggers.newAccount.maxAccountAgeDays) {
        this.notifiedNewAccounts.add(message.author.id);
        await this.takeAction(message, 'newAccount', `New account detected (Age: ${accountAgeDays.toFixed(1)} days)`);
        // Don't return, allow other checks if needed, although we only notify once
      }
    }
  }

  trackMessage(message) {
    const userId = message.author.id;
    const now = Date.now();
    
    if (!this.messageCache.has(userId)) {
      this.messageCache.set(userId, []);
    }
    
    const userMessages = this.messageCache.get(userId);
    userMessages.push({ timestamp: now, content: message.content, id: message.id });
    
    // Clean up old messages from cache
    const timeWindow = (this.config.autoModeration.triggers.messageSpam.timeWindowSeconds || 10) * 1000;
    const filtered = userMessages.filter(msg => now - msg.timestamp < timeWindow);
    this.messageCache.set(userId, filtered);
  }

  isSpamming(userId) {
    const userMessages = this.messageCache.get(userId);
    if (!userMessages) return false;
    
    const threshold = this.config.autoModeration.triggers.messageSpam.messageCount || 5;
    return userMessages.length >= threshold;
  }

  async takeAction(message, triggerType, reason) {
    const triggerConfig = this.config.autoModeration.triggers[triggerType];
    const actionType = triggerConfig.action;
    const actions = this.config.autoModeration.actions || {};
    
    this.logger.info(`Taking action "${actionType}" on user ${message.author.tag} for trigger "${triggerType}": ${reason}`);

    // Log to channel
    await this.logToModChannel(message, triggerType, reason, actionType);

    try {
      // 1. Delete message
      if (actionType === 'delete' || actions.deleteMessage) {
        if (message.deletable) {
          await message.delete().catch(err => this.logger.error('Failed to delete message:', err));
        }
      }

      // 2. Warn user
      if (actionType === 'warn' || actions.warnUser || actionType === 'quarantine') {
        const warningMsg = `⚠️ ${message.author}, please follow the rules. Reason: ${reason}`;
        await message.channel.send(warningMsg)
          .then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 15000);
          })
          .catch(err => this.logger.error('Failed to send warning:', err));
      }

      // 3. Timeout/Mute
      if (actionType === 'mute' || actionType === 'quarantine') {
        const duration = actions.muteDurationMs || 300000;
        if (message.member && message.member.moderatable) {
          await message.member.timeout(duration, `Auto-mod [${triggerType}]: ${reason}`)
            .catch(err => this.logger.error('Failed to timeout member:', err));
        }
      }

      // 4. Kick
      if (actionType === 'kick' || (actions.kickUser && actionType !== 'ban')) {
        if (message.member && message.member.kickable) {
          await message.member.kick(`Auto-mod [${triggerType}]: ${reason}`)
            .catch(err => this.logger.error('Failed to kick member:', err));
        }
      }

      // 5. Ban
      if (actionType === 'ban' || actions.banUser) {
        if (message.member && message.member.bannable) {
          await message.member.ban({ reason: `Auto-mod [${triggerType}]: ${reason}` })
            .catch(err => this.logger.error('Failed to ban member:', err));
        }
      }
    } catch (error) {
      this.logger.error(`Error executing action ${actionType} for trigger ${triggerType}:`, error);
    }
  }

  async logToModChannel(message, triggerType, reason, actionTaken) {
    const logChannelId = this.config.autoModeration.logChannelId;
    if (!logChannelId) return;

    try {
      const channel = await this.client.channels.fetch(logChannelId).catch(() => null);
      if (!channel) return;

      const logStyle = getMessageStyle(this.config, 'autoModeration');

      if (logStyle === 'v2') {
        const v2Message = ComponentBuilder.buildV2Message({
          titleTextDisplay: 'Auto-Moderation Action',
          description: `**User**: ${message.author.tag} (${message.author.id})\n` +
                      `**Channel**: ${message.channel}\n` +
                      `**Trigger**: ${triggerType}\n` +
                      `**Reason**: ${reason}\n` +
                      `**Action Taken**: ${actionTaken}\n\n` +
                      (message.content ? `**Message Content**:\n${message.content.substring(0, 500)}` : ''),
          accentColor: this.config.embedColors?.autoModeration || this.config.embedColors?.warning || 0xFFAA00
        });
        await channel.send(v2Message).catch(err => this.logger.error('Failed to send v2 log message:', err));
        return;
      }

      if (logStyle === 'plain') {
        let logText = `**[Auto-Mod]** Action taken on ${message.author.tag} (${message.author.id})\n`;
        logText += `**Trigger:** ${triggerType}\n`;
        logText += `**Reason:** ${reason}\n`;
        logText += `**Action Taken:** ${actionTaken}\n`;
        logText += `**Channel:** ${message.channel}`;
        
        if (message.content) {
          const truncatedContent = message.content.length > 500 ? message.content.substring(0, 497) + '...' : message.content;
          logText += `\n**Content:** ${truncatedContent}`;
        }

        await channel.send(logText).catch(err => this.logger.error('Failed to send plain log message:', err));
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Auto-Moderation Action')
        .setThumbnail(getDefaultThumbnail(this.config, this.client))
        .setColor(this.config.embedColors?.autoModeration || this.config.embedColors?.warning || 0xFFAA00)
        .addFields(
          { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: 'Channel', value: `${message.channel}`, inline: true },
          { name: 'Trigger', value: triggerType, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Action Taken', value: actionTaken, inline: true }
        );

      if (message.content) {
        embed.addFields({ name: 'Message Content', value: message.content.substring(0, 1024) });
      }

      embed.setTimestamp();

      await channel.send({ embeds: [embed] }).catch(err => this.logger.error('Failed to send log message:', err));
    } catch (error) {
      this.logger.error('Error logging to mod channel:', error);
    }
  }
}
