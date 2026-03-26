import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about available commands'),
  async execute(interaction) {
    const config = interaction.client.tempChannelManager.config;
    
    const embed = new EmbedBuilder()
      .setColor(config.embedColors.primary)
      .setTitle('📚 Utility Discord Bot - Help')
      .setDescription('A powerful utility bot for temporary voice channels and video notifications.\n\n**Bot Author:** Davidf aka darynx')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      
      // General Commands Section
      .addFields(
        { 
          name: '🔧 General Commands', 
          value: [
            '`/ping` - Check bot latency and API response time',
            '`/help` - Display this help message with all available commands'
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
            '',
            '**Features:**',
            '• No API keys required (uses RSS feeds)',
            '• Custom labels for channels',
            '• Configurable check interval (default: 5 minutes)',
            '• Rich embed notifications with thumbnails'
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
            '4. Check out the [GitHub repository](https://github.com/Davidf1121/utility-discord-bot) for more info'
          ].join('\n'), 
          inline: false 
        }
      )
      
      .setTimestamp()
      // GitHub Notifier Section
      .addFields(
        {
          name: '🐙 GitHub Notifier (Admin Only)',
          value: [
            'Receive notifications for GitHub repository events like pushes, pull requests, and issues.',
            '',
            '`/github set-channel` - Set the Discord channel for GitHub notifications',
            '`/github set-webhook` - Configure the webhook URL for GitHub',
            '`/github toggle` - Enable or disable GitHub notifications',
            '`/github test` - Send a test notification to verify setup',
            '',
            '**Features:**',
            '• Push event notifications with commit details',
            '• Pull request open/close/merge notifications',
            '• Issue open/close notifications',
            '• Configurable webhook path and port'
          ].join('\n'),
          inline: false
        }
      )

      // Minecraft Server Section
      .addFields(
        {
          name: '🎮 Minecraft Server Ping (Admin Only)',
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
      
      .setFooter({ 
        text: `Discord Utility Bot | Created by Davidf aka darynx`, 
        iconURL: interaction.client.user.displayAvatarURL() 
      });

    await interaction.reply({ embeds: [embed] });
  }
};
