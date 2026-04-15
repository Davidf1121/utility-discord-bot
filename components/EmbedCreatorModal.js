import { createLogger } from '../utils/Logger.js';

const logger = createLogger('EmbedCreatorModal');

async function updatePreview(interaction) {
  const userId = interaction.user.id;
  const embed = interaction.client.embedCreatorManager.buildEmbed(userId);
  const components = interaction.client.embedCreatorManager.createComponents();
  const state = interaction.client.embedCreatorManager.getOrCreateState(userId);
  const targetChannel = interaction.client.channels.cache.get(state.targetChannelId);

  await interaction.update({
    content: `### Embed Creator\nYou are creating an embed for ${targetChannel || 'unknown channel'}.\nUse the buttons below to customize your embed.`,
    embeds: [embed],
    components: components
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
  }
];

export default modals;
