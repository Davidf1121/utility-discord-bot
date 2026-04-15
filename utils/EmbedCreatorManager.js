import { Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createLogger } from './Logger.js';

const logger = createLogger('EmbedCreatorManager');

export class EmbedCreatorManager {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.states = new Collection();
  }

  getOrCreateState(userId, channelId) {
    if (!this.states.has(userId)) {
      this.states.set(userId, {
        userId,
        targetChannelId: channelId,
        embed: {
          title: '',
          description: '',
          color: this.config.embedColors?.embedCreator || this.config.embedColors?.primary || '#0099ff',
          fields: [],
          footer: { text: '' },
          image: { url: '' },
          thumbnail: { url: '' },
          timestamp: false
        },
        previewMessageId: null
      });
    } else if (channelId) {
      const state = this.states.get(userId);
      state.targetChannelId = channelId;
    }
    return this.states.get(userId);
  }

  updateState(userId, data) {
    const state = this.getOrCreateState(userId);
    Object.assign(state.embed, data);
    return state;
  }

  resetState(userId) {
    const state = this.states.get(userId);
    if (state) {
      const targetChannelId = state.targetChannelId;
      this.states.delete(userId);
      return this.getOrCreateState(userId, targetChannelId);
    }
    return this.getOrCreateState(userId);
  }

  clearState(userId) {
    this.states.delete(userId);
  }

  buildEmbed(userId) {
    const state = this.states.get(userId);
    if (!state) return null;

    const embedData = state.embed;
    const embed = new EmbedBuilder()
      .setColor(embedData.color);

    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.description) embed.setDescription(embedData.description);
    if (embedData.footer?.text) embed.setFooter({ text: embedData.footer.text });
    if (embedData.image?.url) embed.setImage(embedData.image.url);
    if (embedData.thumbnail?.url) embed.setThumbnail(embedData.thumbnail.url);
    if (embedData.timestamp) embed.setTimestamp();
    
    if (embedData.fields && embedData.fields.length > 0) {
      embed.addFields(embedData.fields);
    }

    // If embed is empty, add a placeholder
    if (!embedData.title && !embedData.description && (!embedData.fields || embedData.fields.length === 0) && !embedData.image?.url && !embedData.thumbnail?.url) {
      embed.setDescription('*(Embed is currently empty)*');
    }

    return embed;
  }

  createComponents() {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('embed_creator_title').setLabel('Title').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embed_creator_description').setLabel('Description').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embed_creator_color').setLabel('Color').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embed_creator_footer').setLabel('Footer').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embed_creator_timestamp').setLabel('Timestamp').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('embed_creator_field_add').setLabel('Add Field').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embed_creator_field_remove').setLabel('Remove Last Field').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embed_creator_image').setLabel('Image').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embed_creator_thumbnail').setLabel('Thumbnail').setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('embed_creator_send').setLabel('Send Embed').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('embed_creator_reset').setLabel('Reset').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('embed_creator_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
    );

    return [row1, row2, row3];
  }
}
