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
- **🎮 Minecraft Server Tools**: Ping Java/Bedrock servers, save favorites, and view status
- **🖥️ RCON Console**: Execute Minecraft server commands directly from Discord
- **🧩 Modular Architecture**: Easy to extend with new commands and features
- **⚙️ Configuration-Based**: All settings externalized in `config.json`
- **🔄 Auto Config Upgrade**: Automatically merges settings from backup config files
- **🎨 Customizable**: Configure colors, delays, limits, notification styles, and more

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
| `/auto-reload` | Enable/disable automatic config reloading |

### Voice Channel Commands

| Command | Description |
|---------|-------------|
| `/create` | Open the channel creation modal form |
| `/setup` | Send the control panel with a creation button to the current channel |

### Minecraft Server Commands (Admin Only)

| Command | Description |
|---------|-------------|
| `/mcsrv ping` | Ping a Minecraft server (Java or Bedrock) |
| `/mcsrv list` | List all saved Minecraft servers |
| `/mcsrv add` | Save a Minecraft server for quick access |
| `/mcsrv remove` | Remove a saved Minecraft server |
| `/mcsrv info` | Get detailed info about a saved server |

### RCON Commands (Admin Only)

| Command | Description |
|---------|-------------|
| `/rcon add` | Add a Minecraft RCON server with credentials |
| `/rcon remove` | Remove a saved RCON server |
| `/rcon list` | List all saved RCON servers |
| `/rcon run` | Execute a console command on a Minecraft server |

### Video Notifier Commands (Admin Only)

| Command | Description |
|---------|-------------|
| `/videonotifier list` | List all monitored channels and status |
| `/videonotifier add-youtube` | Add a YouTube channel to monitor |
| `/videonotifier remove-youtube` | Remove a YouTube channel from monitoring |
| `/videonotifier add-tiktok` | Add a TikTok channel to monitor |
| `/videonotifier remove-tiktok` | Remove a TikTok channel from monitoring |
| `/videonotifier set-channel` | Set the Discord channel for video notifications |
| `/videonotifier set-style` | Set notification style (embed or simple text) |
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
   - **Method A: From the URL**
     - Go to the channel's page
     - Look at the URL: `https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx`
     - The channel ID is the string starting with `UC`.
   - **Method B: From Advanced Settings**
     - Go to [YouTube Advanced Settings](https://www.youtube.com/account_advanced)
     - Copy your **Channel ID**.
   - **⚠️ Important**: This is **NOT** your username or handle (e.g., `@username`). It must be the 24-character ID starting with `UC`.

2. **Add the channel**:
   ```
   /videonotifier add-youtube channel-id:UCxxxxxxxxxxxxxxxxxxxxxx label:"Favorite Channel"
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
| `notificationStyle` | Style: `embed` (rich) or `simple` (text only) | `embed` |
| `embedSettings.includeDescription` | Include video description in embed | true |
| `embedSettings.descriptionLength` | Max description length | 200 |

### Notification Styles

The video notifier supports two notification styles:

**Rich Embed (Default)** - `notificationStyle: "embed"`
- Full-color embed with thumbnail
- Video title, description snippet
- Channel label and timestamp
- Best for announcement channels

**Simple Text** - `notificationStyle: "simple"`
- Plain text notification
- Compact format
- Good for busy channels or mobile users

To change styles, use: `/videonotifier set-style style:simple` or `/videonotifier set-style style:embed`

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

### Understanding the Webhook URL

GitHub needs a **publicly accessible URL** to send webhook events to your bot. The webhook URL format is:
```
http://your-public-url:PORT/github-webhook
```

**What is "your-public-url"?**
- If running on a VPS/server: Your server's public IP address or domain name
- If running locally: Use a tool like **ngrok** to create a public tunnel (see below)

### Option A: Local Development with ngrok (Recommended for Testing)

**What is ngrok?**
ngrok is a free tool that creates a temporary public URL that forwards to your local machine - perfect for testing webhooks.

**1. Install ngrok:**
- Download from [ngrok.com](https://ngrok.com/download)
- Or install via package manager:
  ```bash
  # macOS
  brew install ngrok

  # Windows (with Chocolatey)
  choco install ngrok

  # Linux
  snap install ngrok
  ```

**2. Start the bot first:**
```bash
npm start
```

**3. In a new terminal, start ngrok:**
```bash
ngrok http 3000
```

**4. Copy the HTTPS URL** (looks like `https://abc123def.ngrok.io`):
```
Forwarding  https://abc123def.ngrok.io -> http://localhost:3000
```

**5. Your webhook URL is:**
```
https://abc123def.ngrok.io/github-webhook
```

> ⚠️ **Note:** ngrok URLs change every time you restart ngrok. For permanent setups, use a VPS or upgrade to ngrok's paid plan for a static domain.

### Option B: Production Server Setup

If hosting on a VPS or dedicated server:

1. Ensure your server has a public IP address
2. Make sure port 3000 (or your configured port) is open in your firewall
3. Your webhook URL will be: `http://YOUR_SERVER_IP:3000/github-webhook`
4. For HTTPS, use a reverse proxy (nginx) or a service like Cloudflare Tunnel

### Bot Configuration

**1. Configure `config.json`:**

```json
{
  "github": {
    "enabled": true,
    "notificationChannelId": "YOUR_DISCORD_CHANNEL_ID",
    "port": 3000,
    "webhookPath": "/github-webhook",
    "secret": "",
    "embedColors": {
      "push": 5793287,
      "pull_request": 5783218,
      "issues": 15548997,
      "default": 10197915
    }
  }
}
```

| Field | Description | Example |
|-------|-------------|---------|
| `enabled` | Turn the GitHub notifier on/off | `true` |
| `notificationChannelId` | Discord channel ID where notifications are sent | `"123456789012345678"` |
| `port` | Port for the webhook server to listen on | `3000` |
| `webhookPath` | URL path for webhook endpoint | `"/github-webhook"` |
| `secret` | Optional secret for verifying GitHub payloads (see security note below) | `"my-secret-key"` |

**2. Set the notification channel via Discord command:**
```
/github set-channel channel:#github-notifications
```

### Configuring GitHub Repository Webhooks

Follow these steps to add a webhook to your GitHub repository:

**1. Navigate to Webhook Settings:**
   - Go to your repository on GitHub
   - Click **Settings** (tab at the top)
   - Click **Webhooks** in the left sidebar
   - Click **Add webhook** button

**2. Configure the Webhook:**

| Field | Value |
|-------|-------|
| **Payload URL** | Your webhook URL (e.g., `https://abc123.ngrok.io/github-webhook` or `http://your-server-ip:3000/github-webhook`) |
| **Content type** | `application/json` |
| **Secret** | (Optional) Same value as `config.json` `github.secret` |
| **SSL verification** | Enable (default) |

**3. Select Events:**
   - Choose **"Let me select individual events"**
   - Check the following:
     - ✅ **Pushes** - Commit notifications
     - ✅ **Pull requests** - PR open/close/merge
     - ✅ **Issues** - Issue open/close
   - Click **Add webhook**

**4. Verify the webhook is working:**
   - You should see a green checkmark next to the webhook
   - If there's an error, click on the webhook to see delivery details

### Test Your Setup

**1. Check bot status:**
```
/github status
```

**2. Send a test notification:**
```
/github test-push
```

**3. Make a real event:**
   - Push a commit to your repository
   - Create a test issue or pull request
   - Check your Discord channel for the notification!

### Configuration Options Reference

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable/disable GitHub notifier | `true` |
| `port` | Port for webhook server | `3000` |
| `webhookPath` | URL path for webhook endpoint | `"/github-webhook"` |
| `notificationChannelId` | Discord channel ID for notifications | `""` |
| `secret` | Webhook secret for verification (optional) | `""` |
| `embedColors.push` | Color for push notifications | `5793287` (Green) |
| `embedColors.pull_request` | Color for PR notifications | `5783218` (Blurple) |
| `embedColors.issues` | Color for issue notifications | `15548997` (Red) |
| `embedColors.default` | Default color | `10197915` |

### Supported GitHub Events

- **Push**: Shows commit list with author, commit hash, and message
- **Pull Request**: Shows PR open/close/merge events with description
- **Issues**: Shows issue open/close events with description

### 🔒 Security: Webhook Secret (Optional but Recommended)

To ensure webhook events are genuinely from GitHub:

**1. Set a secret in `config.json`:**
```json
"secret": "your-random-secret-key"
```

**2. Use the same secret in GitHub webhook settings**

**3. The bot will verify the signature on incoming webhooks**

> 🔑 Generate a random secret: `openssl rand -hex 20`

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "No GitHub notification channel configured" | Run `/github set-channel` or set `notificationChannelId` in `config.json` |
| Webhook shows red X in GitHub | Check the bot is running and the URL is correct and publicly accessible |
| "Invalid signature" warnings | Make sure the secret in GitHub matches `config.json` exactly (or leave both empty) |
| No notifications for events | Verify you've selected the correct events (Pushes, PRs, Issues) in GitHub webhook settings |
| ngrok URL changed | Restart ngrok gives a new URL - update it in GitHub webhook settings or use a static domain (paid ngrok feature) |
| Firewall blocking webhooks | Ensure port 3000 is open on your server (`sudo ufw allow 3000` on Ubuntu) |

---

## 🔄 Auto Config Upgrade

The bot can automatically detect and merge missing settings from backup config files. This is useful when:

- You have an old `config.json` with settings you want to keep
- You're migrating from an older version of the bot
- You've created backups with names like `config.backup.json`

### How It Works

On startup, the bot will:
1. Scan for backup config files (using configurable patterns)
2. Detect any settings present in backups but missing in the current config
3. Merge those settings into the current config
4. Log all migrations for your review

### Backup Filename Patterns

The following patterns are recognized by default:
- `config.backup.json`
- `config.old.json`
- `config.bak.json`
- `config.backup-*.json` (e.g., `config.backup-2024.json`)
- `config.v*.json` (e.g., `config.v1.json`)
- `config(*).json` (e.g., `config(old).json`)
- `config_old.json`
- `config-backup.json`

### Configuration

In `config.json`:

```json
{
  "autoUpgrade": {
    "enabled": true,
    "backupPatterns": [
      "config.backup.json",
      "config.old.json",
      "config.bak.json"
    ]
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable automatic config upgrades | `true` |
| `backupPatterns` | Array of filename patterns to scan for | See above |

### Safety Features

- **Never overwrites**: Only adds missing keys, never overwrites existing values
- **Preserves structure**: Maintains the new config's structure and formatting
- **Logged migrations**: All changes are logged with their source file
- **Can be disabled**: Set `autoUpgrade.enabled` to `false` to disable

---

## 🎮 Minecraft Server Tools

The bot includes tools for monitoring Minecraft servers - both Java and Bedrock editions.

### Features

- **Ping any server**: Check status of any Minecraft server
- **Server saving**: Save frequently-checked servers for quick access
- **Auto-type detection**: Automatically detects Java vs Bedrock servers
- **Rich embeds**: Shows player count, MOTD, version, and server icon
- **Favorites management**: Add, remove, and list saved servers

### Examples

```bash
# Ping a server
/mcsrv ping address:play.example.com

# Save a server
/mcsrv add address:play.example.com name:"My Server"

# List saved servers
/mcsrv list

# Get detailed info
/mcsrv info address:play.example.com
```

---

## 🖥️ RCON Console

Execute Minecraft server console commands directly from Discord using the RCON protocol.

### Setup

1. Enable RCON in your `server.properties`:
   ```
   enable-rcon=true
   rcon.port=25575
   rcon.password=your_secure_password
   ```
2. Restart your Minecraft server
3. Add the server to the bot: `/rcon add name:survival address:play.example.com:25575 password:yourpass`

### Example Commands

```bash
# Add an operator
/rcon run server:survival command:op PlayerName

# Broadcast a message
/rcon run server:survival command:say Server restart in 5 minutes

# Check player list
/rcon run server:survival command:list

# Whitelist a player
/rcon run server:survival command:whitelist add PlayerName
```

### Security

- Requires Discord Administrator permission
- RCON passwords are stored in `config.json` - ensure it's not committed to version control
- Use strong, unique passwords for RCON access

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
│   ├── github.js
│   ├── mcsrv.js
│   ├── rcon.js
│   └── auto-reload.js
├── components/         # Button and modal handlers
│   ├── CreateTempChannelButton.js
│   └── CreateTempChannelModal.js
├── events/            # Discord event listeners
│   ├── ready.js
│   ├── interactionCreate.js
│   └── voiceStateUpdate.js
├── utils/             # Utility modules
│   ├── ConfigLoader.js
│   ├── ConfigBackupManager.js
│   ├── Logger.js
│   ├── TempChannelManager.js
│   ├── VideoNotifierManager.js
│   ├── GitHubNotifierManager.js
│   ├── MinecraftPing.js
│   ├── MinecraftPingBedrock.js
│   ├── MinecraftRcon.js
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
