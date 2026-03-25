# Quick Start Guide

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

## Configuration Tips

### For Private Servers
Set `controlChannelId` to your welcome or rules channel for announcements.

### For Public Servers
- Create a dedicated "Voice Channels" category
- Run `/setup` in a "bot-commands" channel
- Set a higher user limit in `config.json`

### Customization
- Change colors in `embedColors` to match your server theme
- Adjust `deleteDelay` if you want channels to persist longer
- Set `defaultUserLimit` based on your community size
