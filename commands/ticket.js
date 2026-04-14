import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Send the ticket creation button')
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

      const embed = new EmbedBuilder()
        .setColor(config.embedColors.primary)
        .setTitle('🎫 Support Tickets')
        .setDescription('Need help? Click the button below to open a support ticket!')
        .addFields(
          { name: 'Before Opening', value: 'Please ensure you have read the rules and FAQ before opening a ticket.', inline: false },
          { name: 'Staff Response', value: 'Our staff will be with you as soon as possible. Please be patient.', inline: false }
        )
        .setFooter({ text: 'Ticket System' })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('🎫 Open Ticket')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
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
