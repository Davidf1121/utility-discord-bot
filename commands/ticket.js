import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { getDefaultThumbnail, getMessageStyle } from '../utils/ConfigLoader.js';
import { ComponentBuilder } from '../utils/ComponentBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Send the ticket creation button')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send the setup message to (defaults to current channel)'))
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('Custom description for the setup message'))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close the current ticket')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const config = interaction.client.ticketManager.config;

    if (subcommand === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: 'You do not have permission to use the setup subcommand.',
          ephemeral: true
        });
      }

      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      const customMessage = interaction.options.getString('message');

      const style = getMessageStyle(config, 'ticketSystem');
      
      const button = ComponentBuilder.createButton({
        customId: 'create_ticket',
        label: '🎫 Open Ticket',
        style: ButtonStyle.Primary
      });

      let messagePayload;

      if (style === 'v2') {
        messagePayload = ComponentBuilder.buildV2Message({
          title: '🎫 Support Tickets',
          separator: true,
          description: customMessage || 'Need help? Click the button below to open a support ticket!\n\n' +
                      '**Before Opening**\n' +
                      'Please ensure you have read the rules and FAQ before opening a ticket.\n\n' +
                      '**Staff Response**\n' +
                      'Our staff will be with you as soon as possible. Please be patient.',
          components: [button],
          accentColor: config.embedColors.ticket || config.embedColors.primary
        });
      } else {
        const embed = new EmbedBuilder()
          .setColor(config.embedColors.ticket || config.embedColors.primary)
          .setTitle('🎫 Support Tickets')
          .setThumbnail(getDefaultThumbnail(config, interaction.client))
          .setDescription(customMessage || 'Need help? Click the button below to open a support ticket!')
          .setFooter({ text: 'Ticket System' })
          .setTimestamp();

        if (!customMessage) {
          embed.addFields(
            { name: 'Before Opening', value: 'Please ensure you have read the rules and FAQ before opening a ticket.', inline: false },
            { name: 'Staff Response', value: 'Our staff will be with you as soon as possible. Please be patient.', inline: false }
          );
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder(button)
        );

        messagePayload = {
          embeds: [embed],
          components: [row]
        };
      }

      if (targetChannel.id === interaction.channel.id) {
        await interaction.reply(messagePayload);
      } else {
        try {
          await targetChannel.send(messagePayload);
          await interaction.reply({ content: `✅ Ticket setup message sent to ${targetChannel}`, ephemeral: true });
        } catch (error) {
          await interaction.reply({ content: `❌ Failed to send message to ${targetChannel}: ${error.message}`, ephemeral: true });
        }
      }
    } else if (subcommand === 'close') {
      const isTicket = interaction.client.ticketManager.isTicketChannel(interaction.channel.id);
      const isTicketName = interaction.channel.name.startsWith('ticket-');

      if (!isTicket && !isTicketName) {
        return interaction.reply({
          content: 'This command can only be used in a ticket channel.',
          ephemeral: true
        });
      }

      await interaction.reply('Closing ticket...');
      await interaction.client.ticketManager.closeTicket(interaction.channel, interaction.user);
    }
  }
};
