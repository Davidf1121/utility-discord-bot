export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
  Section: 9,
  TextDisplay: 10,
  File: 13,
  Separator: 14,
  Form: 15,
  Inputs: 16,
  Container: 17,
  Label: 18,
  Thumbnail: 24,
  MediaGallery: 25,
};

export class ComponentBuilder {
  static createContainer({ description, components = [], accentColor = null }) {
    const container = {
      type: ComponentType.Container,
      components: components,
    };

    if (description) container.description = description;
    if (accentColor) container.accent_color = accentColor;

    return container;
  }

  static createSection({ components = [] }) {
    return {
      type: ComponentType.Section,
      components: components,
    };
  }

  static createTextDisplay(content) {
    return {
      type: ComponentType.TextDisplay,
      content: content,
    };
  }

  static createLabel(content) {
    return {
      type: ComponentType.Label,
      content: content,
    };
  }

  static createSeparator() {
    return {
      type: ComponentType.Separator,
    };
  }

  static createThumbnail({ src, size = null }) {
    const thumbnail = {
      type: ComponentType.Thumbnail,
      src: src,
    };

    if (size) thumbnail.size = size;

    return thumbnail;
  }

  static createMediaGallery({ items = [] }) {
    return {
      type: ComponentType.MediaGallery,
      items: items,
    };
  }

  static createActionRow(components = []) {
    return {
      type: ComponentType.ActionRow,
      components: components,
    };
  }

  static createButton({ customId, label, style, emoji, url, disabled }) {
    const button = {
      type: ComponentType.Button,
      style: url ? 5 : (style || 1),
      label: label,
      disabled: disabled,
    };

    if (url) {
      button.url = url;
    } else if (customId) {
      button.custom_id = customId;
    }

    if (emoji) button.emoji = emoji;

    return button;
  }

  static buildV2Message({ components = [], accentColor = 0x5865F2, content = null }) {
    const containerComponents = [];
    let currentButtonRow = [];

    const flushButtons = () => {
      if (currentButtonRow.length > 0) {
        containerComponents.push(this.createActionRow(currentButtonRow));
        currentButtonRow = [];
      }
    };

    components.forEach(comp => {
      if (comp.type === 'button') {
        if (currentButtonRow.length === 5) {
          flushButtons();
        }
        currentButtonRow.push(this.createButton({
          customId: comp.customId,
          label: comp.label,
          style: comp.style,
          url: comp.url,
          emoji: comp.emoji,
          disabled: comp.disabled
        }));
      } else {
        flushButtons();
        switch (comp.type) {
          case 'text':
            containerComponents.push(this.createTextDisplay(comp.content));
            break;
          case 'label':
            containerComponents.push(this.createLabel(comp.content));
            break;
          case 'separator':
            containerComponents.push(this.createSeparator());
            break;
          case 'thumbnail':
            containerComponents.push(this.createThumbnail({ src: comp.src }));
            break;
          case 'mediaGallery':
            containerComponents.push(this.createMediaGallery({ items: comp.items }));
            break;
        }
      }
    });

    flushButtons();

    const container = this.createContainer({
      accentColor: accentColor,
      components: containerComponents,
    });

    return {
      content: content,
      flags: 32768, // Required flag for v2 components
      components: [container]
    };
  }
}