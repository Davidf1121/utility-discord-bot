# Video Notifier Feature Implementation

## Overview
Implemented a YouTube/TikTok upload notifier feature that monitors channels and sends embedded video notifications with thumbnails and links to Discord.

## Files Changed

### 1. `package.json`
- Added `rss-parser` dependency for parsing RSS feeds

### 2. `config.json`
- Added `videoNotifier` configuration section with:
  - `enabled`: Toggle feature on/off
  - `checkInterval`: Polling interval (default: 5 minutes)
  - `notificationChannelId`: Discord channel for notifications
  - `youtube.enabled`: Enable YouTube monitoring
  - `youtube.channels`: Array of YouTube channels to monitor
  - `tiktok.enabled`: Enable TikTok monitoring
  - `tiktok.channels`: Array of TikTok channels to monitor
  - `embedSettings.includeDescription`: Include video description in embed
  - `embedSettings.descriptionLength`: Max description length

### 3. `index.js`
- Imported `VideoNotifierManager`
- Initialized `videoNotifierManager` instance
- Attached manager to `client.videoNotifierManager`

### 4. `events/ready.js`
- Added code to start `videoNotifierManager` when bot is ready (if feature enabled)

### 5. `utils/VideoNotifierManager.js` (NEW)
- Core manager class for video notifications
- Features:
  - Polls RSS feeds for YouTube and TikTok channels
  - Tracks last known video per channel to detect new uploads
  - Sends Discord embeds with thumbnail + video link
  - Methods for adding/removing channels
  - Methods for listing channels
  - Methods for updating configuration
  - YouTube: Uses `https://www.youtube.com/feeds/videos.xml?channel_id=`
  - TikTok: Uses `https://www.tiktok.com/@username/rss`

### 6. `commands/videonotifier.js` (NEW)
- Slash command with subcommands:
  - `list`: List all monitored channels
  - `add-youtube`: Add a YouTube channel (requires channel ID, optional label)
  - `remove-youtube`: Remove a YouTube channel
  - `add-tiktok`: Add a TikTok channel (requires username, optional label)
  - `remove-tiktok`: Remove a TikTok channel
  - `set-channel`: Set Discord notification channel
  - `toggle`: Toggle video notifier on/off
- Requires Administrator permission
- Provides rich embed responses

### 7. `README.md`
- Updated features list
- Added Video Notifier section with setup instructions
- Updated commands table
- Updated project structure
- Added configuration options table

## Usage Example

### Setup YouTube Notifications:
```
/videonotifier set-channel channel:#announcements
/videonotifier add-youtube channel-id:UCxxxxxxxxxxxxx label:"My Favorite Channel"
```

### Setup TikTok Notifications:
```
/videonotifier set-channel channel:#announcements
/videonotifier add-tiktok username:favoriteuser label:"TikTok Creator"
```

### Monitor Status:
```
/videonotifier list
```

## Technical Details

### RSS Feed Parsing
- Uses `rss-parser` library with custom fields for YouTube media:thumbnail
- Handles timeouts gracefully (10 second timeout)
- Supports both YouTube channel IDs and TikTok usernames

### Duplicate Prevention
- Tracks last known video ID per channel in memory Map
- Only sends notifications when new video ID is detected
- Differentiates by platform (youtube:channelId, tiktok:username)

### Discord Embeds
- YouTube embeds include:
  - Thumbnail from media:thumbnail or YouTube default
  - Video title (clickable link)
  - Description snippet (configurable length)
  - Channel label with YouTube icon
  - Timestamp
- TikTok embeds include:
  - Video title (clickable link)
  - Description snippet
  - Channel label with TikTok icon
  - Timestamp

### Error Handling
- Gracefully handles RSS feed failures without crashing
- Logs errors with context (which channel failed and why)
- Continues checking other channels even if one fails
- Warns when notification channel is not configured

### Configuration
- All settings in config.json
- Can be modified at runtime via commands
- Feature can be toggled on/off without restarting bot
- Polling interval is configurable

## Benefits

1. **No API Keys Required**: Uses public RSS feeds
2. **Easy to Use**: Simple slash commands for management
3. **Configurable**: Adjust check interval, embed settings, etc.
4. **Duplicate Prevention**: Tracks last video to avoid spam
5. **Rich Notifications**: Beautiful embeds with thumbnails (YouTube)
6. **Multi-Platform**: Supports both YouTube and TikTok
7. **Admin Control**: Requires admin permissions to manage
8. **Non-Intrusive**: Only notifies when NEW content is posted

## Future Enhancements (Optional)

- Add file persistence for last video IDs (survives bot restart)
- Support for multiple notification channels per server
- Support for YouTube playlists
- Custom embed colors per channel
- Filter by keywords in video title
- Support for more platforms (Instagram, Twitter, etc.)
