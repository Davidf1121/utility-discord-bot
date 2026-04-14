# Auto-Moderation Feature Implementation

**Bot Author:** Davidf aka darynx

## Overview
Implemented a comprehensive auto-moderation system that monitors server messages and takes configured actions against spam, mass mentions, and malicious actors.

## Files Changed

### 1. `index.js`
- Added `GatewayIntentBits.MessageContent` and `GatewayIntentBits.GuildMessages` intents to allow the bot to read and process message content.
- Imported and initialized `AutoModerationManager`.
- Attached manager to `client.autoModerationManager`.
- Updated `updateConfigManagers` to ensure the manager receives configuration updates.

### 2. `config.json`
- Added `autoModeration` configuration section with:
  - `enabled`: Global toggle for the feature.
  - `logChannelId`: Channel where moderation actions are logged.
  - `triggers`: Configurable detection rules:
    - `massMention`: Threshold for user/role mentions.
    - `messageSpam`: Rate limiting (message count over time window).
    - `linkSpam`: Maximum links allowed in a single message.
    - `scammerDetection`: Identification of young accounts using suspicious keywords.
    - `newAccount`: Alerting on accounts younger than a certain age.
  - `actions`: Global action settings (mute duration, etc.).

### 3. `utils/AutoModerationManager.js` (NEW)
- Core logic for detection and enforcement.
- Features:
  - **Permission Check**: Automatically ignores administrators and members with "Manage Messages" permission.
  - **Stateful Tracking**: Maintains an in-memory cache of recent messages for spam detection.
  - **Flexible Actions**: Supports `delete`, `warn`, `mute` (timeout), `kick`, and `ban`.
  - **Mod Logging**: Sends detailed reports to a designated logging channel.
  - **Scammer Heuristics**: Combines account age, avatar presence, and keyword matching.

### 4. `events/messageCreate.js` (NEW)
- Listens for all incoming guild messages.
- Passes valid messages to the `AutoModerationManager` for processing.
- Ignores bot messages and DMs.

### 5. `README.md` & `commands/help.js`
- Added documentation for the new feature and its configuration.

## Triggers and Detection

### 1. Mass Mention
Detects messages containing more than a threshold number of mentions (users, roles, or @everyone).
- **Default Action**: Delete message.

### 2. Message Spam
Tracks the number of messages sent by a user within a rolling time window.
- **Default Action**: Timeout (Mute) for 5 minutes.

### 3. Link Spam
Detects messages containing more than a threshold number of URLs.
- **Default Action**: Delete message.

### 4. Scammer Detection
Targets "Nitro Scams" and similar malicious links by checking:
- Account age < 3 days.
- No profile picture (optional).
- Contains keywords like "nitro", "free", "gift", "steam", "giveaway".
- **Default Action**: Kick from server.

### 5. New Account Alert
Identifies messages from accounts created within a specific timeframe (e.g., 7 days).
- **Default Action**: Warning message in channel.

## Configuration Example

```json
"autoModeration": {
  "enabled": true,
  "logChannelId": "123456789012345678",
  "triggers": {
    "massMention": {
      "enabled": true,
      "threshold": 5,
      "action": "delete"
    },
    "messageSpam": {
      "enabled": true,
      "messageCount": 5,
      "timeWindowSeconds": 10,
      "action": "mute"
    }
  },
  "actions": {
    "muteDurationMs": 300000
  }
}
```

## Benefits

1. **Passive Protection**: Works in the background without requiring active moderator intervention.
2. **Highly Configurable**: Each trigger can have a different action (e.g., delete for links, kick for scammers).
3. **Staff Safety**: Won't accidentally moderate your own team members.
4. **Audit Trail**: All actions are logged to a specific channel for later review.
5. **Reduced Noise**: Cleans up spam instantly, keeping channels readable.

---

**Created by Davidf aka darynx**
