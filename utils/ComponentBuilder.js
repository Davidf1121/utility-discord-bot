
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

  static buildV2Message({ titleTextDisplay, description, markdownContent, textDisplays = [], buttons = [], separator = false, components = [], accentColor = 0x5865F2, content = null }) {
    const containerComponents = [];

    // Add title as text display if provided
    if (titleTextDisplay) {
      containerComponents.push(this.createTextDisplay("# " + titleTextDisplay));
    }

    // Add text displays from the new array
    if (Array.isArray(textDisplays)) {
      textDisplays.forEach(text => {
        if (text) containerComponents.push(this.createTextDisplay(text));
      });
    }

    // Add legacy text content
    if (markdownContent) {
      containerComponents.push(this.createTextDisplay(markdownContent));
    }

    // Add separator if requested or if we have a title/markdown and content following it
    const hasTitle = titleTextDisplay || markdownContent || textDisplays.length > 0;
    const hasContent = description || components.length > 0 || buttons.length > 0;
    if (separator || (hasTitle && hasContent)) {
      containerComponents.push(this.createSeparator());
    }

    if (description) {
      containerComponents.push(this.createTextDisplay(description));
    }

    // Handle components (legacy and new buttons)
    const allButtons = [...buttons];
    const otherComponents = [];

    if (Array.isArray(components)) {
      components.forEach(comp => {
        if (comp.type === ComponentType.Button) {
          allButtons.push(comp);
        } else {
          otherComponents.push(comp);
        }
      });
    }

    otherComponents.forEach(comp => containerComponents.push(comp));

    if (allButtons.length > 0) {
      for (let i = 0; i < allButtons.length; i += 5) {
        containerComponents.push(this.createActionRow(allButtons.slice(i, i + 5)));
      }
    }

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
