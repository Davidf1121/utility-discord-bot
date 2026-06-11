import { Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createLogger } from './Logger.js';
import { ComponentBuilder } from './ComponentBuilder.js';
import { getMessageStyle } from './ConfigLoader.js';

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
        v2: {
          components: []
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

  updateStateV2(userId, data) {
    const state = this.getOrCreateState(userId);
    Object.assign(state.v2, data);
    return state;
  }

  addTextDisplay(userId, content) {
    const state = this.getOrCreateState(userId);
    state.v2.components.push({ type: 'text', content });
    return state;
  }

  addSeparator(userId) {
    const state = this.getOrCreateState(userId);
    state.v2.components.push({ type: 'separator' });
    return state;
  }

  addButton(userId, buttonData) {
    const state = this.getOrCreateState(userId);
    state.v2.components.push({ type: 'button', ...buttonData });
    return state;
  }

  addLabel(userId, content) {
    const state = this.getOrCreateState(userId);
    state.v2.components.push({ type: 'label', content });
    return state;
  }

  setV2Thumbnail(userId, url) {
    const state = this.getOrCreateState(userId);
    if (url && url.trim()) {
      state.v2.components.push({ type: 'thumbnail', src: url.trim() });
    }
    return state;
  }

  addMediaGalleryItem(userId, url) {
    const state = this.getOrCreateState(userId);
    if (url && url.trim()) {
      const lastComp = state.v2.components[state.v2.components.length - 1];
      if (lastComp && lastComp.type === 'mediaGallery') {
        lastComp.items.push({ src: url.trim() });
      } else {
        state.v2.components.push({ type: 'mediaGallery', items: [{ src: url.trim() }] });
      }
    }
    return state;
  }

  removeLastV2Component(userId) {
    const state = this.getOrCreateState(userId);
    state.v2.components.pop();
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

  /**
   * Helper to convert hex color string to decimal number
   * @param {string|number} hex 
   * @returns {number}
   */
  _hexToDecimal(hex) {
    if (typeof hex === 'number') return hex;
    if (!hex || typeof hex !== 'string') return 0;
    return parseInt(hex.replace('#', ''), 16);
  }

  buildEmbed(userId) {
    const state = this.states.get(userId);
    if (!state) return null;

    const embedData = state.embed;
    const embed = new EmbedBuilder()
      .setColor(this._hexToDecimal(embedData.color));

    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.description) embed.setDescription(embedData.description);
    if (embedData.footer?.text) embed.setFooter({ text: embedData.footer.text });
    
    // Check for non-empty URL strings
    const hasImage = embedData.image?.url && embedData.image.url.trim().length > 0;
    const hasThumbnail = embedData.thumbnail?.url && embedData.thumbnail.url.trim().length > 0;

    if (hasImage) embed.setImage(embedData.image.url);
    if (hasThumbnail) embed.setThumbnail(embedData.thumbnail.url);
    if (embedData.timestamp) embed.setTimestamp();
    
    if (embedData.fields && embedData.fields.length > 0) {
      embed.addFields(embedData.fields);
    }

    // If embed is empty, add a placeholder
    if (!embedData.title && !embedData.description && (!embedData.fields || embedData.fields.length === 0) && !hasImage && !hasThumbnail) {
      embed.setDescription('*(Embed is currently empty)*');
    }

    return embed;
  }

  buildMessage(userId, { includeComponents = false } = {}) {
    const style = getMessageStyle(this.config, 'embedCreator');
    const state = this.states.get(userId);
    if (!state) return null;

    let message;
    if (style === 'v2') {
      const components = state.v2.components.length > 0
        ? state.v2.components.map(comp => {
          if (comp.type === 'button') {
            return {
              ...comp,
              customId: comp.customId || (comp.url ? undefined : `v2_btn_${Math.random().toString(36).substr(2, 9)}`)
            };
          }
          return comp;
        })
        : [{ type: 'text', content: '*(No Content)*' }];

      message = ComponentBuilder.buildV2Message({
        components,
        accentColor: this._hexToDecimal(state.embed.color)
      });
    } else {
      message = { embeds: [this.buildEmbed(userId)] };
    }

    if (includeComponents) {
      const creatorComponents = this.createComponents(style, state);
      if (message.components) {
        message.components.push(...creatorComponents);
      } else {
        message.components = creatorComponents;
      }
    }

    return message;
  }

  createComponents(style = 'embed', state = null) {
    if (style === 'v2') {
      const components = state?.v2?.components || [];
      const sepCount = components.filter(c => c.type === 'separator').length;
      const labelCount = components.filter(c => c.type === 'label').length;
      const mediaCount = components.reduce((acc, c) => acc + (c.type === 'mediaGallery' ? c.items.length : 0), 0);
      const hasThumbnail = components.some(c => c.type === 'thumbnail');

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('embed_creator_textdisplay_add').setLabel('Add Text').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('embed_creator_textdisplay_remove').setLabel('Remove Last').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('embed_creator_separator_add').setLabel('Add Separator').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('embed_creator_markdown_line').setLabel(`Seps (${sepCount})`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('embed_creator_button_add').setLabel('Add Button').setStyle(ButtonStyle.Secondary)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('embed_creator_v2_label_add').setLabel(`Labels (${labelCount})`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('embed_creator_v2_thumbnail').setLabel(hasThumbnail ? 'Thumbnail ✓' : 'Thumbnail').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('embed_creator_v2_mediagallery').setLabel(`Gallery (${mediaCount})`).setStyle(ButtonStyle.Secondary)
      );

      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('embed_creator_send').setLabel('Send Message').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('embed_creator_reset').setLabel('Reset').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('embed_creator_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
      );

      return [row1, row2, row3];
    }

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
