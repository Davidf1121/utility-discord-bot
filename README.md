# Utility Discord Bot

[![Discord.js Version](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

A modular, configurable Discord bot with utility functionality built with Discord.js v14 and JavaScript.

**Author:** Davidf aka darynx

**Repository:** [https://github.com/Davidf1121/utility-discord-bot](https://github.com/Davidf1121/utility-discord-bot)

---

## ✨ Features

- **🎤 Temporary Voice Channels**: Create custom voice channels that auto-delete when empty
- **📺 Video Notifier**: Monitor YouTube/TikTok channels and get notifications when new content is posted
- **🧩 Modular Architecture**: Easy to extend with new commands and features
- **⚙️ Configuration-Based**: All settings externalized in `config.json`
- **🔄 Multiple Creation Methods**:
  - Slash command `/create` with modal form
  - Setup command `/setup` to place control buttons
  - Join a "Create Voice Channel" voice channel for instant creation
- **🧹 Auto-Cleanup**: Channels automatically delete when they become empty
- **🎨 Customizable**: Configure colors, delays, limits, and more

---

## 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Davidf1121/utility-discord-bot.git
cd utility-discord-bot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure the bot:**
```bash
cp .env.example .env
```

Edit `.env` and add your Discord bot token:
```
DISCORD_TOKEN=your_bot_token_here
```

4. **Update `config.json` with your server details:**
```json
{
  "clientId": "your_bot_client_id",
  "guildId": "your_server_id",
  "controlChannelId": "channel_id_for_control_panel",
  "voiceCategoryId": "category_id_for_temp_channels",
  ...
}
```

---

## 🔧 Getting Your IDs

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

---

## 🚀 Running the Bot

**Start the bot:**
```bash
npm start
```

**For development with auto-restart:**
```bash
npm run dev
```

---

## ⚙️ Configuration

### config.json Options

| Option | Description | Default |
|--------|-------------|---------|
| `clientId` | Your Discord application ID | Required |
| `guildId` | Your Discord server ID | Required |
| `controlChannelId` | Channel for voice channel control panel | Optional |
| `voiceCategoryId` | Category for temp channels | Required |
| `tempChannelSettings.deleteDelay` | Delay before deletion (ms) | 5000 |
| `tempChannelSettings.defaultUserLimit` | Max users per channel | 10 |
| `tempChannelSettings.bitrate` | Audio quality (bps) | 64000 |
| `embedColors.primary` | Primary embed color | 5783218 (Blurple) |
| `embedColors.success` | Success embed color | 5793287 (Green) |
| `embedColors.warning` | Warning embed color | 16775964 (Yellow) |
| `embedColors.error` | Error embed color | 15548997 (Red) |

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency |
| `/create` | Open channel creation modal |
| `/setup` | Send control panel to current channel |
| `/help` | Display available commands |
| `/videonotifier` | Manage video notifications (requires Admin) |
| &nbsp;&nbsp;`/videonotifier list` | List all monitored channels |
| &nbsp;&nbsp;`/videonotifier add-youtube` | Add a YouTube channel to monitor |
| &nbsp;&nbsp;`/videonotifier remove-youtube` | Remove a YouTube channel |
| &nbsp;&nbsp;`/videonotifier add-tiktok` | Add a TikTok channel to monitor |
| &nbsp;&nbsp;`/videonotifier remove-tiktok` | Remove a TikTok channel |
| &nbsp;&nbsp;`/videonotifier set-channel` | Set Discord notification channel |
| &nbsp;&nbsp;`/videonotifier toggle` | Toggle video notifier on/off |

---

## 📺 Video Notifier Setup

The video notifier monitors YouTube and TikTok channels and sends Discord notifications when new content is posted.

### Setting Up YouTube Notifications

1. **Get the YouTube Channel ID**:
   - Go to the channel's page
   - Look at the URL: `https://www.youtube.com/channel/CHANNEL_ID` or `https://www.youtube.com/@username`
   - The channel ID is the string after `/channel/` or you can use the username

2. **Add the channel**:
   ```
   /videonotifier add-youtube channel-id:UCxxxxxxxxxxxxx label:"Favorite Channel"
   ```

3. **Set the notification channel**:
   ```
   /videonotifier set-channel channel:#announcements
   ```

### Setting Up TikTok Notifications

1. **Get the TikTok username**:
   - The username is the handle without the @ (e.g., "username" from "@username")

2. **Add the channel**:
   ```
   /videonotifier add-tiktok username:favoriteuser label:"TikTok Star"
   ```

3. **Set the notification channel**:
   ```
   /videonotifier set-channel channel:#announcements
   ```

### Managing Notifications

- **List all channels**: `/videonotifier list`
- **Remove a channel**: `/videonotifier remove-youtube` or `/videonotifier remove-tiktok`
- **Toggle on/off**: `/videonotifier toggle`

### Configuration Options

In `config.json`, under `videoNotifier`:

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable/disable video notifier | true |
| `checkInterval` | How often to check for new videos (ms) | 300000 (5 min) |
| `notificationChannelId` | Discord channel ID for notifications | "" |
| `youtubeNotificationChannelId` | Separate channel for YouTube notifications (optional) | "" |
| `tiktokNotificationChannelId` | Separate channel for TikTok notifications (optional) | "" |
| `youtube.enabled` | Enable YouTube monitoring | true |
| `tiktok.enabled` | Enable TikTok monitoring | true |
| `embedSettings.includeDescription` | Include video description in embed | true |
| `embedSettings.descriptionLength` | Max description length | 200 |

### Notification Embed Format

Notifications include:
- Video title (clickable link)
- Thumbnail (YouTube only)
- Description snippet
- Channel label
- Timestamp

### Notes

- The bot uses RSS feeds to monitor channels - no API keys required
- YouTube: Uses `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- TikTok: Uses `https://www.tiktok.com/@username/rss`
- Configurable check interval (default: 5 minutes)
- Tracks last known video to avoid duplicate notifications

---

## 🎤 Voice Channel Setup

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

---

## 🔐 Required Bot Permissions

- `Manage Channels` - To create and delete voice channels
- `Connect` - To move users between voice channels
- `View Channel` - To see channels in the category
- `Send Messages` - For commands and control panel
- `Embed Links` - For rich embeds

---

## 📁 Project Structure

```
utility-discord-bot/
├── commands/           # Slash command handlers
│   ├── ping.js
│   ├── create.js
│   ├── setup.js
│   ├── help.js
│   └── videonotifier.js
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
│   ├── VideoNotifierManager.js
│   └── fileLoader.js
├── config.json        # Bot configuration
├── .env.example       # Environment variables template
├── .gitignore
├── package.json
└── index.js          # Entry point
```

---

## 🛠️ Extending the Bot

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

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📝 License

ISC

---

## 👤 Author

**Davidf aka darynx**

- GitHub: [@Davidf1121](https://github.com/Davidf1121)
- Project: [utility-discord-bot](https://github.com/Davidf1121/utility-discord-bot)
