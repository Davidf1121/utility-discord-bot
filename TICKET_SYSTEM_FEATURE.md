# 🎫 Ticket System Feature

The Ticket System allows users to open private support tickets with custom titles and descriptions. Staff members can then interact with the users in these private channels and close them when resolved.

## ✨ Features

- **Custom Tickets**: Users provide a title and description for their issue.
- **Private Channels**: Tickets are created in private channels visible only to the user and staff.
- **Persistent Counter**: Ticket IDs are tracked and incremented across bot restarts.
- **Staff Roles**: Configurable roles that have access to all tickets.
- **Easy Closure**: Close tickets via a button in the channel or a slash command.
- **Auto-Cleanup**: Ticket channels are automatically deleted after a short delay when closed.

## 🚀 Setup

### 1. Configure in `config.json`

Add or update the `ticketSystem` section in your `config.json`:

```json
"ticketSystem": {
  "enabled": true,
  "ticketCategoryId": "CATEGORY_ID",
  "ticketStaffRoles": ["ROLE_ID_1", "ROLE_ID_2"],
  "ticketWelcomeMessage": "Welcome to your ticket, {user}! Staff will be with you shortly.",
  "ticketCounter": 0
}
```

| Option | Description |
|--------|-------------|
| `enabled` | Enable or disable the ticket system. |
| `ticketCategoryId` | (Optional) The ID of the category where ticket channels will be created. |
| `ticketStaffRoles` | An array of Role IDs that should have access to support tickets. |
| `ticketWelcomeMessage` | The message sent at the top of a new ticket. Use `{user}` for a mention. |
| `ticketCounter` | The current ticket number (automatically updated). |
| `pingStaffOnCreate` | Whether to mention staff roles in the channel when a ticket is created. |

### 2. Deploy the Creation Button

Run the following command in the channel where you want users to be able to open tickets:

```
/ticket setup
```

This will send an embed with an "Open Ticket" button.

## 📋 Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/ticket setup` | Sends the ticket creation panel. | Manage Guild |
| `/ticket close` | Closes the current ticket channel. | Ticket Owner or Staff |

## 🛠️ How It Works

1. **Opening a Ticket**: When a user clicks the "Open Ticket" button, they are presented with a modal form.
2. **Form Submission**: Upon submission, a new text channel is created.
3. **Permissions**:
   - `@everyone` is denied `View Channel`.
   - The ticket opener is granted `View Channel`, `Send Messages`, etc.
   - All roles listed in `ticketStaffRoles` are granted full access to the channel.
4. **Welcome Message**: The bot sends an embed with the ticket details and a "Close Ticket" button.
5. **Closing**: Either the user or a staff member clicks "Close Ticket" or uses `/ticket close`. The bot sends a closing message and deletes the channel after 5 seconds.

## 🎨 Customization

You can customize the embed colors used by the ticket system in the `embedColors` section of `config.json`:

- `primary`: Used for the setup embed and the ticket welcome embed.
- `success`: Used for the "Ticket Created" confirmation.
- `warning`: Used for the "Ticket Closed" notification.
- `error`: Used for error messages.
