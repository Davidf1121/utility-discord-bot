import { createLogger } from './Logger.js';
import { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { saveConfig } from './ConfigLoader.js';

export class TicketManager {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.logger = createLogger('TicketManager');
    this.openTickets = new Map();
  }

  async createTicketChannel(guild, user, title, description) {
    const ticketConfig = this.config.ticketSystem;
    if (!ticketConfig || !ticketConfig.enabled) {
      this.logger.warn('Ticket system is disabled or not configured');
      return null;
    }

    const categoryId = ticketConfig.ticketCategoryId;
    const category = categoryId ? guild.channels.cache.get(categoryId) : null;

    const ticketNumber = (ticketConfig.ticketCounter || 0) + 1;
    ticketConfig.ticketCounter = ticketNumber;
    saveConfig(this.config);

    const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

    const permissionOverwrites = [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks,
        ],
      },
    ];

    if (ticketConfig.ticketStaffRoles && ticketConfig.ticketStaffRoles.length > 0) {
      ticketConfig.ticketStaffRoles.forEach(roleId => {
        if (!roleId) return;
        permissionOverwrites.push({
          id: roleId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ManageMessages,
          ],
        });
      });
    }

    try {
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category ? category.id : null,
        permissionOverwrites,
      });

      this.openTickets.set(channel.id, {
        userId: user.id,
        createdAt: Date.now(),
        title,
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`Ticket: ${title}`)
        .setDescription(ticketConfig.ticketWelcomeMessage.replace('{user}', `<@${user.id}>`))
        .addFields(
          { name: 'Description', value: description || 'No description provided' },
          { name: 'Opened by', value: `<@${user.id}>`, inline: true },
          { name: 'Ticket ID', value: ticketNumber.toString().padStart(4, '0'), inline: true }
        )
        .setColor(this.config.embedColors.primary)
        .setTimestamp();

      const closeButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({
        content: `<@${user.id}> | Staff`,
        embeds: [welcomeEmbed],
        components: [closeButton],
      });

      this.logger.info(`Created ticket channel ${channel.id} for user ${user.id}`);
      return channel;
    } catch (error) {
      this.logger.error('Error creating ticket channel:', error);
      return null;
    }
  }

  async closeTicket(channel, closedBy) {
    if (!channel) return;

    try {
      const closingEmbed = new EmbedBuilder()
        .setTitle('Ticket Closed')
        .setDescription(`This ticket has been closed by <@${closedBy.id}>.`)
        .setColor(this.config.embedColors.warning)
        .setTimestamp();

      await channel.send({ embeds: [closingEmbed] });
      
      this.logger.info(`Closing ticket channel ${channel.id}`);
      
      setTimeout(async () => {
        try {
          // Check if channel still exists before deleting
          const freshChannel = await this.client.channels.fetch(channel.id).catch(() => null);
          if (freshChannel) {
            await freshChannel.delete('Ticket closed');
          }
          this.openTickets.delete(channel.id);
        } catch (err) {
          this.logger.error(`Error deleting closed ticket channel ${channel.id}:`, err);
        }
      }, 5000);

    } catch (error) {
      this.logger.error(`Error closing ticket channel ${channel.id}:`, error);
    }
  }

  isTicketChannel(channelId) {
    // If it's in our memory Map, it's definitely a ticket channel
    if (this.openTickets.has(channelId)) return true;
    
    // Fallback: check channel name pattern if it's not in memory (e.g. after bot restart)
    // This is a bit risky but can be helpful. For now, let's keep it simple.
    return false;
  }
}
