import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDefaultThumbnail } from '../utils/ConfigLoader.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about available commands'),
  async execute(interaction) {
    const config = interaction.client.tempChannelManager.config;
    
    const prefix = interaction.client.tempChannelManager.config.prefix || '!';
    
    const embed = new EmbedBuilder()
      .setColor(config.embedColors.primary)
      .setTitle('📚 Utility Discord Bot - Help')
      .setDescription(`A powerful utility bot for temporary voice channels and video notifications.\n\n**Bot Author:** Davidf aka darynx\n\n**Text Commands:** You can also use commands with the prefix \`${prefix}\` (e.g., \`${prefix}ping\` or \`${prefix}mcsrv ping play.example.com\`)`)
      .setThumbnail(getDefaultThumbnail(config, interaction.client))
      
      // General Commands Section
      .addFields(
        { 
          name: '🔧 General Commands', 
          value: [
            '`/ping` - Check bot latency and API response time',
            '`/help` - Display this help message with all available commands',
            '`/setting list` - Show all current bot settings',
            '`/setting embed colors` - View or change feature-specific embed colors'
          ].join('\n'), 
          inline: false 
        }
      )
      
      // Auto-Reload Section
      .addFields(
        { 
          name: '🔄 Auto-Reload (Admin Only)', 
          value: [
            'Enable or disable automatic config reloading without restarting the bot.',
            '',
            '`/auto-reload` - Enable or disable automatic config reload',
            '',
            '**Features:**',
            '• Automatic config updates while bot is running',
            '• Configurable reload interval (default: 60 seconds)',
            '• Real-time configuration changes without restart'
          ].join('\n'), 
          inline: false 
        }
      )
      
      // RCON Commands Section
      .addFields(
        {
          name: '🎮 RCON Console (Admin Only)',
          value: [
            'Execute console commands on Minecraft RCON-enabled servers.',
            '',
            '`/rcon add` - Save a Minecraft RCON server for command execution',
            '`/rcon remove` - Remove a saved RCON server',
            '`/rcon list` - List all saved RCON servers',
            '`/rcon run` - Execute a command on a Minecraft server',
            '',
            '**Features:**',
            '• Secure RCON password storage',
            '• Auto-connection testing on add',
            '• Command output display with truncation handling',
            '• Autocomplete for server names'
          ].join('\n'),
          inline: false
        }
      )
      
      // Temporary Voice Channels Section
      .addFields(
        { 
          name: '🎤 Temporary Voice Channels', 
          value: [
            'Create custom voice channels that automatically delete when empty.',
            '',
            '`/create` - Open the channel creation modal form',
            '`/setup` - Send the control panel with a creation button to the current channel',
            '',
            '**Features:**',
            '• Custom channel names',
            '• Configurable user limits',
            '• Auto-delete when empty (5 second delay)',
            '• Quick creation via button or join-to-create'
          ].join('\n'), 
          inline: false 
        }
      )
      
      // Video Notifier Section
      .addFields(
        { 
          name: '📺 Video Notifier (Admin Only)', 
          value: [
            'Monitor YouTube and TikTok channels for new content and receive notifications.',
            '',
            '`/videonotifier list` - List all monitored channels',
            '`/videonotifier add-youtube` - Add a YouTube channel to monitor',
            '`/videonotifier remove-youtube` - Remove a YouTube channel from monitoring',
            '`/videonotifier add-tiktok` - Add a TikTok channel to monitor',
            '`/videonotifier remove-tiktok` - Remove a TikTok channel from monitoring',
            '`/videonotifier set-channel` - Set the Discord channel for video notifications',
            '`/videonotifier toggle` - Enable or disable video notifications',
            '`/videonotifier set-style` - Set notification style (embed or simple)',
            '`/videonotifier test-youtube` - Send a test YouTube notification',
            '`/videonotifier test-tiktok` - Send a test TikTok notification',
            '',
            '**Features:**',
            '• No API keys required (uses RSS feeds)',
            '• Custom labels for channels',
            '• Configurable check interval (default: 5 minutes)',
            '• Rich embed notifications with thumbnails',
            '• Two notification styles: Rich Embed or Simple Text'
          ].join('\n'), 
          inline: false 
        }
      )
      
      // GitHub Notifier Section
      .addFields(
        {
          name: '🐙 GitHub Notifier (Admin Only)',
          value: [
            'Receive notifications for GitHub repository events like pushes, pull requests, and issues.',
            '',
            '`/github set-channel` - Set the Discord channel for GitHub notifications',
            '`/github set-port` - Set the port for the GitHub webhook server',
            '`/github toggle` - Enable or disable GitHub notifications',
            '`/github status` - Show GitHub notifier status',
            '`/github test-push` - Send a test GitHub push notification',
            '',
            '**Features:**',
            '• Push event notifications with commit details',
            '• Pull request open/close/merge notifications',
            '• Issue open/close notifications',
            '• Configurable webhook port (default: 3000)',
            '• Webhook endpoint at /github-webhook'
          ].join('\n'),
          inline: false
        }
      )

      // Auto-Moderation Section
      .addFields(
        {
          name: '🛡️ Auto-Moderation',
          value: [
            'Automatically protect your server from spam and malicious actors.',
            '',
            '**Triggers:**',
            '• **Mass Mention** - Detects excessive user or role mentions',
            '• **Message Spam** - Detects rapid-fire messaging',
            '• **Link Spam** - Detects excessive links in a single message',
            '• **Scammer Detection** - Flags new accounts with suspicious keywords',
            '• **New Account Alerts** - Notifies when very young accounts post',
            '',
            '**Actions:**',
            '• Deleting violating messages',
            '• Warning users automatically',
            '• Muting (Timeout), Kicking, or Banning persistent offenders',
            '',
            '**Status:** This feature runs automatically on all incoming messages. Configure it in `config.json`.'
          ].join('\n'),
          inline: false
        }
      )

      // Minecraft Server Section
      .addFields(
        {
          name: '⛏️ Minecraft Server Ping (Admin Only)',
          value: [
            'Query Minecraft servers to display status, player count, version, MOTD, latency, server type, and favicon.',
            '',
            '`/mcsrv ping` - Ping a server by address (e.g., play.example.com:25565)',
            '`/mcsrv list` - Show all saved servers',
            '`/mcsrv add` - Save a server for quick access',
            '`/mcsrv remove` - Remove a saved server',
            '`/mcsrv info` - Get detailed info about a saved server',
            '',
            '**Features:**',
            '• Support for Java and Bedrock editions',
            '• Server type detection (Vanilla, Paper, Spigot, Fabric, etc.)',
            '• Favicon display as embed thumbnail',
            '• Player count and sample players',
            '• Latency measurement',
            '• Custom server names and descriptions',
            '• Network-only ping (no SFTP required)'
          ].join('\n'),
          inline: false
        }
      )
      
      // Config Auto-Upgrade Section
      .addFields(
        {
          name: '⚙️ Config Auto-Upgrade',
          value: [
            'Automatic configuration recovery from backup files.',
            '',
            '**How it works:**',
            '• Bot automatically scans for backup config files',
            '• Missing settings are migrated from backups',
            '• Supports various backup naming patterns',
            '',
            '**Supported patterns:**',
            '• config.backup.json, config.old.json, config.bak.json',
            '• config.backup-*.json, config.v*.json',
            '• config_old.json, config-backup.json',
            '',
            '**Status:** This feature runs automatically on bot startup. No command needed.'
          ].join('\n'),
          inline: false
        }
      )
      
      // Quick Start Section
      .addFields(
        { 
          name: '🚀 Quick Start', 
          value: [
            '1. Use `/setup` to place the voice channel creation button',
            '2. Click the button or use `/create` to make voice channels',
            '3. Use `/videonotifier` commands to monitor your favorite creators',
            '4. Use `/rcon add` to set up RCON server access',
            '5. Use `/mcsrv add` to save Minecraft servers',
            '6. Use `/github` commands to set up GitHub webhooks',
            '7. Check out the [GitHub repository](https://github.com/Davidf1121/utility-discord-bot) for more info'
          ].join('\n'), 
          inline: false 
        }
      )
      
      .setTimestamp()
      
      .setFooter({ 
        text: `Discord Utility Bot | Created by Davidf aka darynx`, 
        iconURL: interaction.client.user.displayAvatarURL() 
      });

    await interaction.reply({ embeds: [embed] });
  }
};
