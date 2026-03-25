# Utility Discord Bot

A modular, configurable Discord bot with temporary voice channel functionality built with Discord.js v14 and JavaScript.

## Features

- **Temporary Voice Channels**: Create custom voice channels that auto-delete when empty
- **Modular Architecture**: Easy to extend with new commands and features
- **Configuration-Based**: All settings externalized in `config.json`
- **Multiple Creation Methods**:
  - Slash command `/create` with modal form
  - Setup command `/setup` to place control buttons
  - Join a "Create Voice Channel" voice channel for instant creation
- **Auto-Cleanup**: Channels automatically delete when they become empty
- **Customizable**: Configure colors, delays, limits, and more

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd utility-discord-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot:
```bash
cp .env.example .env
```

Edit `.env` and add your Discord bot token:
```
DISCORD_TOKEN=your_bot_token_here
```

4. Update `config.json` with your server details:
```json
{
  "clientId": "your_bot_client_id",
  "guildId": "your_server_id",
  "controlChannelId": "channel_id_for_control_panel",
  "voiceCategoryId": "category_id_for_temp_channels",
  ...
}
```

## Getting Your IDs

### Bot Client ID
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Copy the "Application ID"

### Server (Guild) ID
1. Enable Developer Mode in Discord (User Settings > Advanced)
2. Right-click on your server > Copy Server ID

### Channel & Category IDs
1. With Developer Mode enabled
2. Right-click on a channel or category > Copy ID

## Running the Bot

Start the bot:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Configuration

### config.json Options

| Option | Description | Default |
|--------|-------------|---------|
| `clientId` | Your Discord application ID | Required |
| `guildId` | Your Discord server ID | Required |
| `controlChannelId` | Channel for control panel | Optional |
| `voiceCategoryId` | Category for temp channels | Required |
| `tempChannelSettings.deleteDelay` | Delay before deletion (ms) | 5000 |
| `tempChannelSettings.defaultUserLimit` | Max users per channel | 10 |
| `tempChannelSettings.bitrate` | Audio quality (bps) | 64000 |
| `embedColors.primary` | Primary embed color | 5783218 (Blurple) |
| `embedColors.success` | Success embed color | 5793287 (Green) |
| `embedColors.warning` | Warning embed color | 16775964 (Yellow) |
| `embedColors.error` | Error embed color | 15548997 (Red) |

## Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency |
| `/create` | Open channel creation modal |
| `/setup` | Send control panel to current channel |
| `/help` | Display available commands |

## Voice Channel Setup

The bot provides multiple ways to create temporary voice channels:

### Method 1: Using the /create Command
1. Use the `/create` slash command
2. A modal form will appear
3. Fill in your channel name and user limit
4. Your temporary channel is created automatically

### Method 2: Using the Setup Button
1. Run `/setup` in a text channel where you want the control panel
2. A button will appear labeled "🎤 Create Voice Channel"
3. Anyone can click this button to open the channel creation form
4. Fill in the details and get your channel

### Method 3: Quick Access (Optional Voice Channel)
1. Create a voice channel in your server
2. Configure the bot's `voiceCategoryId` in config.json to this channel's ID
3. When users join this specific voice channel, they are automatically moved to a new temporary channel created just for them
4. The temporary channel is named after the user and configured according to the settings

## Required Bot Permissions

- `Manage Channels` - To create and delete voice channels
- `Connect` - To move users between voice channels
- `View Channel` - To see channels in the category
- `Send Messages` - For commands and control panel
- `Embed Links` - For rich embeds

## Project Structure

```
utility-discord-bot/
├── commands/           # Slash command handlers
│   ├── ping.js
│   ├── create.js
│   ├── setup.js
│   └── help.js
├── components/         # Button and modal handlers
│   ├── CreateTempChannelButton.js
│   └── CreateTempChannelModal.js
├── events/            # Discord event listeners
│   ├── ready.js
│   ├── interactionCreate.js
│   └── voiceStateUpdate.js
├── utils/             # Utility modules
│   ├── ConfigLoader.js
│   ├── Logger.js
│   ├── TempChannelManager.js
│   └── fileLoader.js
├── config.json        # Bot configuration
├── .env.example       # Environment variables template
├── .gitignore
├── package.json
└── index.js          # Entry point
```

## Extending the Bot

### Adding a New Command
Create a new file in `commands/`:
```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('My command description'),
  async execute(interaction) {
    await interaction.reply('Hello!');
  }
};
```

### Adding a New Button
Create a new file in `components/`:
```javascript
export default {
  customId: 'my_button',
  async execute(interaction) {
    await interaction.reply('Button clicked!');
  }
};
```

### Adding a New Event
Create a new file in `events/`:
```javascript
export default {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    console.log(`${member.user.tag} joined`);
  }
};
```

## License

ISC
