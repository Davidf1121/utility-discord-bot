# Discord Components v2 & Raw API Helper

Discord Components v2 (IS_COMPONENTS_V2 flag=32768) introduce new layout components like Containers, Sections, Text Displays, and Separators. Since `discord.js` v14 doesn't fully support these yet, we use a raw API helper to send these components.

## DiscordApiHelper

The `DiscordApiHelper` provides direct access to Discord's REST API using `fetch()`.

### Usage

```javascript
// Send a message with v2 components
const payload = ComponentBuilder.buildV2Message({
  titleTextDisplay: 'My V2 Message',
  description: 'This uses a Container component!',
  accentColor: 0x5865F2
});

await client.apiHelper.sendMessage(channelId, payload);
```

### Methods

- `sendMessage(channelId, payload)`: Send a message to a channel.
- `editMessage(channelId, messageId, payload)`: Edit an existing message.
- `deleteMessage(channelId, messageId)`: Delete a message.
- `sendInteractionResponse(interactionId, interactionToken, payload)`: Respond to an interaction.
- `editOriginalInteractionResponse(applicationId, interactionToken, payload)`: Edit the original interaction response.
- `sendFollowupMessage(applicationId, interactionToken, payload)`: Send a followup message.

## ComponentBuilder V2

The `ComponentBuilder` has been enhanced to support V2 component types.

### Component Types

- `Container` (17): A box that can contain other components.
- `Section` (18): A section within a container.
- `TextDisplay` (10): A component for displaying text.
- `Separator` (14): A horizontal line separator.

### Example: Building a complex V2 message

```javascript
const container = ComponentBuilder.createContainer({
  accentColor: 0x5865F2,
  components: [
    ComponentBuilder.createSection({
      components: [
        ComponentBuilder.createTextDisplay('# Main Title'),
        ComponentBuilder.createSeparator(),
        ComponentBuilder.createTextDisplay('Text inside a section'),
        ComponentBuilder.createSeparator(),
        ComponentBuilder.createActionRow([
          ComponentBuilder.createButton({ customId: 'btn1', label: 'Click Me', style: 1 })
        ])
      ]
    })
  ]
});

const payload = {
  components: [container],
  flags: 32768 // IS_COMPONENTS_V2
};

await client.apiHelper.sendMessage(channelId, payload);
```
