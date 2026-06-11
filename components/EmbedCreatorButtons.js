import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { createLogger } from '../utils/Logger.js';

const logger = createLogger('EmbedCreatorButtons');

async function updatePreview(interaction) {
  const userId = interaction.user.id;
  const message = interaction.client.embedCreatorManager.buildMessage(userId, { includeComponents: true });
  const state = interaction.client.embedCreatorManager.getOrCreateState(userId);
  const targetChannel = interaction.client.channels.cache.get(state.targetChannelId);

  const components = state.v2.components || [];
  const textCount = components.filter(c => c.type === 'text').length;
  const buttonCount = components.filter(c => c.type === 'button').length;
  const sepCount = components.filter(c => c.type === 'separator').length;
  const labelCount = components.filter(c => c.type === 'label').length;
  const mediaCount = components.reduce((acc, c) => acc + (c.type === 'mediaGallery' ? c.items.length : 0), 0);
  const hasThumbnail = components.some(c => c.type === 'thumbnail');

  let stats = `\n**Components:** ${components.length}`;
  if (textCount > 0) stats += ` | Text: ${textCount}`;
  if (buttonCount > 0) stats += ` | Buttons: ${buttonCount}`;
  if (sepCount > 0) stats += ` | Seps: ${sepCount}`;
  if (labelCount > 0) stats += ` | Labels: ${labelCount}`;
  if (mediaCount > 0) stats += ` | Gallery: ${mediaCount}`;
  if (hasThumbnail) stats += ` | Thumbnail: ✅`;

  await interaction.update({
    content: `### Embed Creator\nYou are creating a message for ${targetChannel || 'unknown channel'}.\nUse the buttons below to customize your message.${stats}`,
    ...message
  });
}

const buttons = [
  {
    customId: 'embed_creator_title',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_title')
        .setTitle('Set Embed Title');

      const input = new TextInputBuilder()
        .setCustomId('title_input')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(state.embed.title || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_description',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_description')
        .setTitle('Set Embed Description');

      const input = new TextInputBuilder()
        .setCustomId('description_input')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(state.embed.description || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_color',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_color')
        .setTitle('Set Message Color');

      const input = new TextInputBuilder()
        .setCustomId('color_input')
        .setLabel('Color (Hex) - Also sets V2 Accent Color')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('#0099ff')
        .setValue(state.embed.color || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_footer',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_footer')
        .setTitle('Set Embed Footer');

      const input = new TextInputBuilder()
        .setCustomId('footer_input')
        .setLabel('Footer Text')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(state.embed.footer?.text || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_timestamp',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      state.embed.timestamp = !state.embed.timestamp;
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_textdisplay_add',
    async execute(interaction) {
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_textdisplay')
        .setTitle('Add Text Display');

      const input = new TextInputBuilder()
        .setCustomId('text_input')
        .setLabel('Content')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('Enter markdown content...');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_textdisplay_remove',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      if (state.v2.components.length > 0) {
        interaction.client.embedCreatorManager.removeLastV2Component(interaction.user.id);
        await updatePreview(interaction);
      } else {
        await interaction.reply({ content: 'No components to remove.', ephemeral: true });
      }
    }
  },
  {
    customId: 'embed_creator_separator_add',
    async execute(interaction) {
      interaction.client.embedCreatorManager.addSeparator(interaction.user.id);
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_markdown_line',
    async execute(interaction) {
      // Toggle separator logic was complex before, now we just add one or remove last if it's a separator?
      // Actually, let's just make it add a separator for now as a shortcut, or keep it as it is if it's just a label.
      // The button label in createComponents shows the count.
      await interaction.reply({ content: 'Use "Add Separator" to add a line, or "Remove Last" to remove the last component.', ephemeral: true });
    }
  },
  {
    customId: 'embed_creator_button_add',
    async execute(interaction) {
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_button')
        .setTitle('Add Button');

      const labelInput = new TextInputBuilder()
        .setCustomId('button_label')
        .setLabel('Button Label')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const urlInput = new TextInputBuilder()
        .setCustomId('button_url')
        .setLabel('Button URL (Optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('https://example.com');

      const idInput = new TextInputBuilder()
        .setCustomId('button_id')
        .setLabel('Button Custom ID (Optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('my_custom_id (ignored if URL set)');

      const styleInput = new TextInputBuilder()
        .setCustomId('button_style')
        .setLabel('Style (1=Primary, 2=Sec, 3=Success, 4=Danger)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('1');

      modal.addComponents(
        new ActionRowBuilder().addComponents(labelInput),
        new ActionRowBuilder().addComponents(urlInput),
        new ActionRowBuilder().addComponents(idInput),
        new ActionRowBuilder().addComponents(styleInput)
      );
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_v2_label_add',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_v2_label')
        .setTitle('Add Label');

      const input = new TextInputBuilder()
        .setCustomId('label_input')
        .setLabel('Label Text')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('e.g., NEW, BETA, INFO');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_v2_thumbnail',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_v2_thumbnail')
        .setTitle('Set V2 Thumbnail');

      const input = new TextInputBuilder()
        .setCustomId('thumbnail_input')
        .setLabel('Image URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('https://example.com/image.png');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_v2_mediagallery',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_v2_mediagallery')
        .setTitle('Add Media Gallery Item');

      const input = new TextInputBuilder()
        .setCustomId('gallery_input')
        .setLabel('Image/Video URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('https://example.com/image.png');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_field_add',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      if (state.embed.fields.length >= 25) {
        return interaction.reply({ content: 'You can only have up to 25 fields.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_field')
        .setTitle('Add Field');

      const nameInput = new TextInputBuilder()
        .setCustomId('field_name')
        .setLabel('Field Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const valueInput = new TextInputBuilder()
        .setCustomId('field_value')
        .setLabel('Field Value')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const inlineInput = new TextInputBuilder()
        .setCustomId('field_inline')
        .setLabel('Inline? (yes/no)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('no');

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(valueInput),
        new ActionRowBuilder().addComponents(inlineInput)
      );
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_field_remove',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      if (state.embed.fields.length > 0) {
        state.embed.fields.pop();
        await updatePreview(interaction);
      } else {
        await interaction.reply({ content: 'No fields to remove.', ephemeral: true });
      }
    }
  },
  {
    customId: 'embed_creator_image',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_image')
        .setTitle('Set Embed Image');

      const input = new TextInputBuilder()
        .setCustomId('image_input')
        .setLabel('Image URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(state.embed.image?.url || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_thumbnail',
    async execute(interaction) {
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      const modal = new ModalBuilder()
        .setCustomId('embed_creator_modal_thumbnail')
        .setTitle('Set Embed Thumbnail');

      const input = new TextInputBuilder()
        .setCustomId('thumbnail_input')
        .setLabel('Thumbnail URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(state.embed.thumbnail?.url || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
  {
    customId: 'embed_creator_send',
    async execute(interaction) {
      const userId = interaction.user.id;
      const state = interaction.client.embedCreatorManager.getOrCreateState(userId);
      const targetChannel = interaction.client.channels.cache.get(state.targetChannelId);

      if (!targetChannel) {
        return interaction.reply({ content: 'Could not find the target channel. It might have been deleted.', ephemeral: true });
      }

      const message = interaction.client.embedCreatorManager.buildMessage(userId);
      
      try {
        await targetChannel.send(message);
        interaction.client.embedCreatorManager.clearState(userId);
        await interaction.update({
          content: `✅ Message successfully sent to ${targetChannel}!`,
          embeds: [],
          components: []
        });
      } catch (error) {
        logger.error(`Error sending message to channel ${state.targetChannelId}:`, error);
        await interaction.reply({ content: 'Failed to send message to the channel. Make sure I have permission to send messages there.', ephemeral: true });
      }
    }
  },
  {
    customId: 'embed_creator_reset',
    async execute(interaction) {
      const userId = interaction.user.id;
      interaction.client.embedCreatorManager.resetState(userId);
      const message = interaction.client.embedCreatorManager.buildMessage(userId, { includeComponents: true });
      const state = interaction.client.embedCreatorManager.getOrCreateState(userId);
      const targetChannel = interaction.client.channels.cache.get(state.targetChannelId);

      await interaction.deferUpdate();
      await interaction.followUp({
        content: `### Embed Creator\nYou are creating a message for ${targetChannel || 'unknown channel'}.\nUse the buttons below to customize your message.`,
        ephemeral: true,
        ...message
      });

      try {
        await interaction.message.delete();
      } catch (error) {
        logger.error('Failed to delete original preview message on reset:', error);
      }
    }
  },
  {
    customId: 'embed_creator_cancel',
    async execute(interaction) {
      interaction.client.embedCreatorManager.clearState(interaction.user.id);
      
      await interaction.deferUpdate();
      await interaction.followUp({
        content: '❌ Embed creation cancelled.',
        ephemeral: true
      });

      try {
        await interaction.message.delete();
      } catch (error) {
        logger.error('Failed to delete original preview message on cancel:', error);
      }
    }
  }
];

export default buttons;
