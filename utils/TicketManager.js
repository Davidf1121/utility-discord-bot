import { createLogger } from './Logger.js';
import { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { saveConfig, getDefaultThumbnail, getMessageStyle } from './ConfigLoader.js';
import { ComponentBuilder } from './ComponentBuilder.js';

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

    const categoryId = ticketConfig.ticketCategoryId ? String(ticketConfig.ticketCategoryId) : null;
    const category = categoryId ? guild.channels.cache.get(categoryId) : null;
    
    if (categoryId && !category) {
      this.logger.warn(`Ticket category ID ${categoryId} not found in guild ${guild.id}`);
    }

    const ticketNumber = (ticketConfig.ticketCounter || 0) + 1;
    ticketConfig.ticketCounter = ticketNumber;
    saveConfig(this.config);

    const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

    // Prepare staff roles - convert to strings and validate
    this.logger.debug(`Processing staff roles from config: ${JSON.stringify(ticketConfig.ticketStaffRoles)}`);
    
    let staffRoles = [];
    if (Array.isArray(ticketConfig.ticketStaffRoles)) {
      staffRoles = ticketConfig.ticketStaffRoles;
    } else if (typeof ticketConfig.ticketStaffRoles === 'string') {
      staffRoles = ticketConfig.ticketStaffRoles.split(',').map(s => s.trim());
    }

    const validStaffRoles = [];
    for (const roleId of staffRoles) {
      const stringId = String(roleId).trim();
      if (!stringId) continue;
      
      try {
        // Fetch role to ensure it exists and is accessible
        const role = await guild.roles.fetch(stringId).catch(() => null);
        if (role) {
          validStaffRoles.push(stringId);
          this.logger.debug(`Validated staff role: ${role.name} (${stringId})`);
        } else {
          this.logger.warn(`Staff role ID ${stringId} not found in guild ${guild.id}`);
        }
      } catch (err) {
        this.logger.error(`Error fetching role ${stringId}:`, err);
      }
    }
    
    this.logger.info(`Ticket creation for ${user.tag} (${user.id}). Valid staff roles: ${validStaffRoles.length ? validStaffRoles.join(', ') : 'None'}`);

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

    // Add staff role permissions
    for (const roleId of validStaffRoles) {
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

      const staffMentions = validStaffRoles.length > 0
        ? validStaffRoles.map(roleId => `<@&${roleId}>`).join(' ')
        : '';

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`Ticket: ${title}`)
        .setThumbnail(getDefaultThumbnail(this.config, this.client))
        .setDescription(ticketConfig.ticketWelcomeMessage.replace('{user}', `<@${user.id}>`))
        .addFields(
          { name: 'Description', value: description || 'No description provided' },
          { name: 'Opened by', value: `<@${user.id}>`, inline: true },
          { name: 'Ticket ID', value: ticketNumber.toString().padStart(4, '0'), inline: true }
        )
        .setColor(this.config.embedColors.ticket || this.config.embedColors.primary)
        .setTimestamp();

      if (staffMentions) {
        welcomeEmbed.addFields({ name: 'Staff Notified', value: staffMentions });
      }

      const closeButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      // Ensure pingStaffOnCreate is properly read as a boolean
      const shouldPingStaff = ticketConfig.pingStaffOnCreate === true || ticketConfig.pingStaffOnCreate === 'true';
      const content = shouldPingStaff && staffMentions
        ? `<@${user.id}> | ${staffMentions}`
        : `<@${user.id}> | Staff`;

      const style = getMessageStyle(this.config, 'ticketSystem');

      if (style === 'v2') {
        const v2Message = ComponentBuilder.buildV2Message({
          title: `Ticket: ${title}`,
          description: ticketConfig.ticketWelcomeMessage.replace('{user}', `<@${user.id}>`) + 
                      `\n\n**Description**\n${description || 'No description provided'}` +
                      (staffMentions ? `\n\n**Staff Notified**\n${staffMentions}` : '') +
                      `\n\n**Ticket ID**: ${ticketNumber.toString().padStart(4, '0')}`,
          content,
          components: [
            ComponentBuilder.createButton({
              customId: 'close_ticket',
              label: 'Close Ticket',
              style: ButtonStyle.Danger,
              emoji: { name: '🔒' }
            })
          ],
          accentColor: this.config.embedColors.ticket || this.config.embedColors.primary
        });

        await channel.send(v2Message);
      } else {
        const welcomeEmbed = new EmbedBuilder()
          .setTitle(`Ticket: ${title}`)
          .setThumbnail(getDefaultThumbnail(this.config, this.client))
          .setDescription(ticketConfig.ticketWelcomeMessage.replace('{user}', `<@${user.id}>`))
          .addFields(
            { name: 'Description', value: description || 'No description provided' },
            { name: 'Opened by', value: `<@${user.id}>`, inline: true },
            { name: 'Ticket ID', value: ticketNumber.toString().padStart(4, '0'), inline: true }
          )
          .setColor(this.config.embedColors.ticket || this.config.embedColors.primary)
          .setTimestamp();

        if (staffMentions) {
          welcomeEmbed.addFields({ name: 'Staff Notified', value: staffMentions });
        }

        const closeButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );

        await channel.send({
          content,
          embeds: [welcomeEmbed],
          components: [closeButton],
        });
      }

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
      const style = getMessageStyle(this.config, 'ticketSystem');
      
      if (style === 'v2') {
        const v2Message = ComponentBuilder.buildV2Message({
          title: 'Ticket Closed',
          description: `This ticket has been closed by <@${closedBy.id}>.`,
          accentColor: this.config.embedColors.warning
        });
        await channel.send(v2Message);
      } else {
        const closingEmbed = new EmbedBuilder()
          .setTitle('Ticket Closed')
          .setThumbnail(getDefaultThumbnail(this.config, this.client))
          .setDescription(`This ticket has been closed by <@${closedBy.id}>.`)
          .setColor(this.config.embedColors.warning)
          .setTimestamp();

        await channel.send({ embeds: [closingEmbed] });
      }
      
      // Log to control channel
      if (this.config.controlChannelId) {
        try {
          const controlChannel = await this.client.channels.fetch(this.config.controlChannelId).catch(() => null);
          if (controlChannel && controlChannel.isTextBased()) {
            const ticketInfo = this.openTickets.get(channel.id);
            const logEmbed = new EmbedBuilder()
              .setTitle('🔒 Ticket Closed')
              .setColor(this.config.embedColors.warning)
              .addFields(
                { name: 'Channel', value: `#${channel.name}`, inline: true },
                { name: 'Closed by', value: `${closedBy.tag} (<@${closedBy.id}>)`, inline: true }
              )
              .setTimestamp();
            
            if (ticketInfo) {
              logEmbed.addFields(
                { name: 'Ticket Title', value: ticketInfo.title || 'Unknown', inline: false },
                { name: 'Opened by', value: `<@${ticketInfo.userId}>`, inline: true }
              );
            }

            await controlChannel.send({ embeds: [logEmbed] }).catch(err => this.logger.debug('Could not send close log to control channel:', err));
          }
        } catch (err) {
          this.logger.debug('Error sending ticket close log:', err);
        }
      }

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
