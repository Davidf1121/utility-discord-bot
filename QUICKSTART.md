# Quick Start Guide

**Bot Author:** Davidf aka darynx

## Setup Instructions (5 minutes)

### 1. Create a Discord Bot Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name and click "Create"
4. Go to the "Bot" tab and click "Add Bot"
5. Copy your **Bot Token** (you'll need this later)
6. Enable the following intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### 2. Get Your IDs
Enable **Developer Mode** in Discord (User Settings > Advanced), then:

**Get Bot Client ID:**
- In Discord Developer Portal, copy "Application ID"

**Get Server ID:**
- Right-click your server > Copy Server ID

**Get Category ID:**
- Create a "Voice Channels" category in your server
- Right-click it > Copy Category ID

**Get Control Channel ID (optional):**
- Create or select a text channel for the bot to use
- Right-click it > Copy Channel ID

### 3. Configure the Bot
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env`:
```
DISCORD_TOKEN=your_bot_token_here
```

Edit `config.json`:
```json
{
  "clientId": "YOUR_APPLICATION_ID",
  "guildId": "YOUR_SERVER_ID",
  "controlChannelId": "YOUR_TEXT_CHANNEL_ID",
  "voiceCategoryId": "YOUR_CATEGORY_ID",
  ...
}
```

### 4. Invite the Bot to Your Server
1. In Discord Developer Portal, go to "OAuth2" > "URL Generator"
2. Under "Scopes", select:
   - ✅ bot
   - ✅ applications.commands
3. Under "Bot Permissions", select:
   - ✅ Manage Channels
   - ✅ Connect
   - ✅ View Channel
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Use Application Commands
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### 5. Start the Bot
```bash
npm start
```

You should see:
```
[Bot INFO] Logged in as YourBot#1234
[Bot INFO] Ready to serve 1 guilds
[Bot INFO] Loaded event: ready
[Bot INFO] Loaded event: interactionCreate
[Bot INFO] Loaded event: voiceStateUpdate
[Bot INFO] Loaded component: create_temp_channel
[Bot INFO] Loaded component: create_temp_channel_modal
[Bot INFO] Loaded command: ping
[Bot INFO] Loaded command: create
[Bot INFO] Loaded command: setup
[Bot INFO] Loaded command: help
[Bot INFO] Loaded command: videonotifier
[Bot INFO] Loaded command: github
```

### 6. Test the Bot
In your Discord server:

**Test 1: Check if bot is working**
```
/ping
```
Should show bot latency.

**Test 2: Create a control panel**
```
/setup
```
This places a "Create Voice Channel" button in the channel.

**Test 3: Create a temporary channel**
Click the button or use:
```
/create
```
Fill in the form and a new voice channel will appear!

**Test 4: Test video notifier**
```
/videonotifier set-channel channel:#announcements
/videonotifier test-youtube
```

**Test 5: Test GitHub notifier**
```
/github set-channel channel:#github-notifications
/github test-push
```

**Test 6: Ping a Minecraft server**
```
/mcsrv ping address:play.example.com
```

**Test 7: Toggle auto-reload**
```
/auto-reload enabled:true
```

---

## Setting Up Video Notifier

### YouTube Notifications
1. Find a YouTube channel ID (from the channel URL)
2. Set the notification channel:
   ```
   /videonotifier set-channel channel:#announcements
   ```
3. Add a YouTube channel:
   ```
   /videonotifier add-youtube channel-id:UCxxxxxxxxxxxxx label:"My Channel"
   ```
4. Test it:
   ```
   /videonotifier test-youtube
   ```

### TikTok Notifications
1. Get the TikTok username (without @)
2. Add a TikTok channel:
   ```
   /videonotifier add-tiktok username:coolcreator label:"Cool Creator"
   ```
3. Test it:
   ```
   /videonotifier test-tiktok
   ```

### Managing Video Notifications
- List all channels: `/videonotifier list`
- Remove a channel: `/videonotifier remove-youtube` or `/videonotifier remove-tiktok`
- Toggle on/off: `/videonotifier toggle`
- Change notification style: `/videonotifier set-style style:simple`

---

## Setting Up Minecraft Server Tools

### Ping a Server
```
/mcsrv ping address:play.example.com
```
- Supports both Java and Bedrock editions
- Auto-detects server type
- Shows player count, version, MOTD, and server icon

### Save Favorite Servers
```
/mcsrv add address:play.example.com name:"My Server" type:java
```
- Save frequently-checked servers
- Quick access via autocomplete
- Track server description and type

### View Saved Servers
```
/mcsrv list
```

---

## Setting Up RCON Console

RCON lets you execute Minecraft server commands from Discord.

### 1. Enable RCON on Your Minecraft Server

Edit `server.properties` on your Minecraft server:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password
```

Restart your Minecraft server.

### 2. Add Server to Bot
```
/rcon add name:survival address:play.example.com:25575 password:yourpass
```

### 3. Execute Commands
```
/rcon run server:survival command:list
/rcon run server:survival command:say Hello from Discord!
/rcon run server:survival command:op PlayerName
```

### Common RCON Commands
- `list` - Show online players
- `say <message>` - Broadcast a message
- `op <player>` - Give operator status
- `gamemode <mode> <player>` - Change game mode
- `whitelist add <player>` - Add to whitelist
- `save-all` - Save the world

> ⚠️ **Security**: RCON commands require Discord Administrator permission. RCON passwords are stored in `config.json` - keep this file secure!

---

## Setting Up GitHub Integration

1. Set the notification channel:
   ```
   /github set-channel channel:#github-notifications
   ```
2. Check the status:
   ```
   /github status
   ```
3. Test with a push notification:
   ```
   /github test-push
   ```
4. In your GitHub repository, add a webhook:
   - Payload URL: `http://your-server-ip:3000/github-webhook`
   - Content type: `application/json`
   - Events: Pushes, Pull requests, Issues

---

## Troubleshooting

### Bot doesn't respond to commands
- Make sure you've invited the bot with "Use Application Commands" permission
- Commands may take up to 1 hour to register, or restart the bot
- Check that `clientId` and `guildId` are correct in config.json

### Bot can't create voice channels
- Verify "Manage Channels" permission is granted
- Check that the `voiceCategoryId` in config is correct
- Make sure the bot can see the category (View Channel permission)

### Channels don't auto-delete
- Check that `features.autoCleanup` is true in config.json
- Verify the bot has "Manage Channels" permission
- The deletion has a 5-second delay after the last user leaves

### Bot immediately exits
- Make sure `.env` file exists and contains `DISCORD_TOKEN`
- Verify the token is correct (no extra spaces)
- Check that all intents are enabled in Discord Developer Portal

### Video notifier not working
- Check that `features.videoNotifier` is true in config.json
- Verify the notification channel is set: `/videonotifier set-channel`
- Test with: `/videonotifier test-youtube`
- Check bot logs for RSS feed errors

### GitHub notifier not working
- Check that `github.enabled` is true in config.json
- Verify the webhook server is running (`/github status`)
- Ensure the notification channel is set: `/github set-channel`
- Test with: `/github test-push`

### Minecraft server ping fails
- Verify the server address is correct
- Check that `features.minecraftServer` is true in config.json
- For Bedrock servers, specify the type: `/mcsrv ping address:play.example.com type:bedrock`
- Some servers block ping requests - this is normal

### RCON connection fails
- Verify RCON is enabled in `server.properties`
- Check the RCON port is correct (default: 25575)
- Ensure the password matches exactly
- Check firewall rules allow RCON connections
- The bot and server must be able to communicate directly

### Auto config upgrade not working
- Check that `autoUpgrade.enabled` is true (default)
- Ensure backup files match the patterns in `autoUpgrade.backupPatterns`
- Only **missing** keys are migrated - existing values are never overwritten
- Check bot logs for migration messages

---

## Auto Config Upgrade

The bot can automatically merge settings from old config files.

### How It Works
When the bot starts, it scans for backup config files (like `config.backup.json`, `config.old.json`) and merges any missing settings into your current config.

### Disable Auto-Upgrade
If you don't want this feature:
```json
{
  "autoUpgrade": {
    "enabled": false
  }
}
```

### Backup File Patterns
The bot recognizes these patterns by default:
- `config.backup.json`
- `config.old.json`
- `config.bak.json`
- `config.backup-*.json`
- `config.v*.json`
- `config(*).json`
- `config_old.json`
- `config-backup.json`

---

## Configuration Tips

### For Private Servers
- Set `controlChannelId` to your welcome or rules channel for announcements
- Use separate channels for video and GitHub notifications

### For Public Servers
- Create a dedicated "Voice Channels" category
- Run `/setup` in a "bot-commands" channel
- Set a higher user limit in `config.json`
- Set up dedicated notification channels for videos and GitHub

### Customization
- Change colors in `embedColors` to match your server theme
- Adjust `deleteDelay` if you want channels to persist longer
- Set `defaultUserLimit` based on your community size
- Customize GitHub embed colors per event type
- Change video notification style: `/videonotifier set-style style:embed` or `style:simple`

### Auto-Reload
Enable auto-reload to apply config changes without restarting:
```
/auto-reload enabled:true
```
This reloads `config.json` every 60 seconds (configurable via `autoReload.intervalSeconds`).

---

**Created by Davidf aka darynx**
