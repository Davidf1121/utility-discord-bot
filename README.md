# Utility Discord Bot

[![Discord.js Version](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

A modular, configurable Discord bot with utility functionality built with Discord.js v14 and JavaScript.

**Bot Author:** Davidf aka darynx

---

## ✨ Features

- **🎤 Temporary Voice Channels**: Create custom voice channels that auto-delete when empty
- **📺 Video Notifier**: Monitor YouTube/TikTok channels and get notifications when new content is posted
- **🐙 GitHub Integration**: Receive Discord notifications for GitHub events (pushes, pull requests, issues)
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

### General Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency |
| `/help` | Display available commands and bot information |

### Voice Channel Commands

| Command | Description |
|---------|-------------|
| `/create` | Open the channel creation modal form |
| `/setup` | Send the control panel with a creation button to the current channel |

### Video Notifier Commands (Admin Only)

| Command | Description |
|---------|-------------|
| `/videonotifier list` | List all monitored channels and status |
| `/videonotifier add-youtube` | Add a YouTube channel to monitor |
| `/videonotifier remove-youtube` | Remove a YouTube channel from monitoring |
| `/videonotifier add-tiktok` | Add a TikTok channel to monitor |
| `/videonotifier remove-tiktok` | Remove a TikTok channel from monitoring |
| `/videonotifier set-channel` | Set the Discord channel for video notifications |
| `/videonotifier toggle` | Enable or disable video notifications |
| `/videonotifier test-youtube` | Send a test YouTube notification |
| `/videonotifier test-tiktok` | Send a test TikTok notification |

### GitHub Integration Commands (Admin Only)

| Command | Description |
|---------|-------------|
| `/github status` | Show GitHub notifier status |
| `/github set-channel` | Set the Discord channel for GitHub notifications |
| `/github set-port` | Set the port for the GitHub webhook server |
| `/github toggle` | Enable or disable GitHub notifications |
| `/github test-push` | Send a test GitHub push notification |

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

4. **Test the setup**:
   ```
   /videonotifier test-youtube
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

4. **Test the setup**:
   ```
   /videonotifier test-tiktok
   ```

### Managing Notifications

- **List all channels**: `/videonotifier list`
- **Remove a channel**: `/videonotifier remove-youtube` or `/videonotifier remove-tiktok`
- **Toggle on/off**: `/videonotifier toggle`
- **Test notifications**: `/videonotifier test-youtube` or `/videonotifier test-tiktok`

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

## 🐙 GitHub Integration Setup

The GitHub integration receives webhook events and sends Discord notifications for pushes, pull requests, and issues.

### Setting Up GitHub Webhooks

1. **Set the notification channel**:
   ```
   /github set-channel channel:#github-notifications
   ```

2. **Configure the webhook server port** (optional, default: 3000):
   ```
   /github set-port port:3000
   ```

3. **Check status**:
   ```
   /github status
   ```

4. **Test the setup**:
   ```
   /github test-push
   ```

### Configuring GitHub Repository Webhooks

1. Go to your GitHub repository settings
2. Navigate to "Webhooks" > "Add webhook"
3. Set Payload URL to: `http://your-server-ip:3000/github-webhook`
4. Set Content type to: `application/json`
5. Select events: Pushes, Pull requests, Issues
6. Click "Add webhook"

### Configuration Options

In `config.json`, under `github`:

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable/disable GitHub notifier | true |
| `port` | Port for webhook server | 3000 |
| `notificationChannelId` | Discord channel ID for notifications | "" |
| `secret` | Webhook secret for verification (optional) | "" |
| `embedColors.push` | Color for push notifications | 5793287 (Green) |
| `embedColors.pull_request` | Color for PR notifications | 5783218 (Blurple) |
| `embedColors.issues` | Color for issue notifications | 15548997 (Red) |
| `embedColors.default` | Default color | 10197915 |

### Supported GitHub Events

- **Push**: Shows commit list with author, commit hash, and message
- **Pull Request**: Shows PR open/close/merge events with description
- **Issues**: Shows issue open/close events with description

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
│   ├── videonotifier.js
│   └── github.js
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
│   ├── GitHubNotifierManager.js
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

**Created by Davidf aka darynx**
