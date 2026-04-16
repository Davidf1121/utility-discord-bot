
export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
  TextDisplay: 10,
  Separator: 14,
  Container: 17,
  Section: 18,
};

export class ComponentBuilder {
  static createContainer({ title, description, components = [], accentColor = null }) {
    return {
      type: ComponentType.Container,
      title: title,
      description: description,
      accent_color: accentColor,
      components: components,
    };
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

  static createSeparator() {
    return {
      type: ComponentType.Separator,
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
      style: style,
      label: label,
      disabled: disabled,
    };

    if (customId) button.custom_id = customId;
    if (emoji) button.emoji = emoji;
    if (url) button.url = url;

    return button;
  }

  static buildV2Message({ title, description, components = [], accentColor = 0x5865F2 }) {
    const containerComponents = [];

    if (description) {
      containerComponents.push(this.createTextDisplay(description));
    }

    if (components.length > 0) {
      if (description) {
        containerComponents.push(this.createSeparator());
      }
      
      // In v2, buttons should be in an ActionRow within the container
      const buttons = components.filter(comp => comp.type === ComponentType.Button);
      const nonButtons = components.filter(comp => comp.type !== ComponentType.Button);

      nonButtons.forEach(comp => containerComponents.push(comp));
      
      if (buttons.length > 0) {
        // Group buttons into action rows (max 5 per row)
        for (let i = 0; i < buttons.length; i += 5) {
          containerComponents.push(this.createActionRow(buttons.slice(i, i + 5)));
        }
      }
    }

    const container = this.createContainer({
      title: title,
      accentColor: accentColor,
      components: containerComponents,
    });

    return {
      flags: 32768, // Required flag for v2 components
      components: [container]
    };
  }
}
