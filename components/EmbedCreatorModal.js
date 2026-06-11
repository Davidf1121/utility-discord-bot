import { createLogger } from '../utils/Logger.js';

const logger = createLogger('EmbedCreatorModal');

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

const modals = [
  {
    customId: 'embed_creator_modal_title',
    async execute(interaction) {
      const title = interaction.fields.getTextInputValue('title_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { title });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_description',
    async execute(interaction) {
      const description = interaction.fields.getTextInputValue('description_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { description });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_color',
    async execute(interaction) {
      let color = interaction.fields.getTextInputValue('color_input');
      if (color && !color.startsWith('#')) color = '#' + color;
      
      // Simple hex validation
      if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
        return interaction.reply({ content: 'Invalid hex color format. Use something like #0099ff', ephemeral: true });
      }

      interaction.client.embedCreatorManager.updateState(interaction.user.id, { color: color || undefined });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_footer',
    async execute(interaction) {
      const text = interaction.fields.getTextInputValue('footer_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { footer: { text } });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_field',
    async execute(interaction) {
      const name = interaction.fields.getTextInputValue('field_name');
      const value = interaction.fields.getTextInputValue('field_value');
      const inline = interaction.fields.getTextInputValue('field_inline').toLowerCase() === 'yes';
      
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      state.embed.fields.push({ name, value, inline });
      
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_image',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('image_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { image: { url } });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_thumbnail',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('thumbnail_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { thumbnail: { url } });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_textdisplay',
    async execute(interaction) {
      const content = interaction.fields.getTextInputValue('text_input');
      interaction.client.embedCreatorManager.addTextDisplay(interaction.user.id, content);
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_button',
    async execute(interaction) {
      const label = interaction.fields.getTextInputValue('button_label');
      const url = interaction.fields.getTextInputValue('button_url');
      const customId = interaction.fields.getTextInputValue('button_id');
      const styleStr = interaction.fields.getTextInputValue('button_style');
      const style = parseInt(styleStr) || 1;

      interaction.client.embedCreatorManager.addButton(interaction.user.id, {
        label,
        url: url || undefined,
        customId: (url || !customId) ? undefined : customId,
        style: url ? 5 : style
      });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_v2_label',
    async execute(interaction) {
      const content = interaction.fields.getTextInputValue('label_input');
      if (!content || !content.trim()) {
        return interaction.reply({ content: 'Label text cannot be empty.', ephemeral: true });
      }
      interaction.client.embedCreatorManager.addLabel(interaction.user.id, content.trim());
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_v2_thumbnail',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('thumbnail_input');
      if (url && url.trim()) {
        const trimmed = url.trim();
        // Basic URL validation
        if (!/^https?:\/\/.+/.test(trimmed)) {
          return interaction.reply({ content: 'Please enter a valid URL (starting with http:// or https://).', ephemeral: true });
        }
        interaction.client.embedCreatorManager.setV2Thumbnail(interaction.user.id, trimmed);
      } else {
        // Empty input clears the thumbnail
        interaction.client.embedCreatorManager.setV2Thumbnail(interaction.user.id, '');
      }
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_v2_mediagallery',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('gallery_input');
      if (!url || !url.trim()) {
        return interaction.reply({ content: 'Please enter a URL for the gallery item.', ephemeral: true });
      }
      const trimmed = url.trim();
      // Basic URL validation
      if (!/^https?:\/\/.+/.test(trimmed)) {
        return interaction.reply({ content: 'Please enter a valid URL (starting with http:// or https://).', ephemeral: true });
      }
      interaction.client.embedCreatorManager.addMediaGalleryItem(interaction.user.id, trimmed);
      await updatePreview(interaction);
    }
  }
];

export default modals;
