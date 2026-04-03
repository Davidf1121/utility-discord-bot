# Minecraft RCON Feature

This Discord bot feature allows administrators to execute console commands on Minecraft servers using the RCON protocol.

## Overview

The RCON (Remote Console) feature enables Discord users with administrator permissions to:
- Add Minecraft RCON servers with credentials
- Execute server console commands directly from Discord
- Manage saved RCON servers (add/remove/list)

## Usage

### Add a Server
```
/rcon add <name> <address> <password>
```
- `name`: Unique identifier for the server (e.g., "survival", "creative")
- `address`: Server address including port (e.g., `play.example.com:25575`)
- `password`: RCON password configured in server.properties

### List Servers
```
/rcon list
```
Shows all saved RCON servers with their addresses and connection info.

### Execute Commands
```
/rcon run <server> <command>
```
- `server`: Name of the saved server to execute the command on
- `command`: Any Minecraft console command (e.g., `/op player`, `/say Hello`, `/gamemode survival @a`)

### Remove Server
```
/rcon remove <server>
```
Removes a saved RCON server by its name.

## Configuration

The RCON feature is configured in `config.json`:

```json
{
  "rcon": {
    "enabled": true,
    "savedServers": [],
    "timeout": 5000
  }
}
```

- `enabled`: Enable/disable the RCON feature
- `savedServers`: Array of saved server configurations (auto-populated)
- `timeout`: Connection timeout in milliseconds (default: 5000)

## Server Setup

To use RCON with a Minecraft server:

1. Edit `server.properties`:
   ```
   enable-rcon=true
   rcon.port=25575
   rcon.password=your_secure_password
   ```

2. Restart the Minecraft server

3. Add the server to the bot using `/rcon add`

## Example Commands

```bash
# Add a server
/rcon add survival play.example.com:25575 securepass123

# Get server status
/rcon run survival list

# Give operator to a player
/rcon run survival op PlayerName

# Broadcast a message
/rcon run survival say Server restart in 5 minutes

# Change game mode
/rcon run survival gamemode creative PlayerName

# Whitelist a player
/rcon run survival whitelist add PlayerName

# Save the world
/rcon run survival save-all
```

## Permissions

The RCON commands require Discord Administrator permissions:
- `PermissionFlagsBits.Administrator`

## Features

- **Connection Pooling**: Maintains persistent connections for faster command execution
- **Auto-reconnection**: Automatically reconnects if connection is lost
- **Error Handling**: Graceful error messages for connection issues
- **Response Truncation**: Long responses are truncated to fit Discord's message limits
- **Connection Testing**: Verifies connectivity when adding a new server
- **Autocomplete**: Server names autocomplete in Discord command interface

## Security Notes

- RCON passwords are stored in plain text in `config.json`
- Ensure `config.json` is not committed to version control (use `.gitignore`)
- Consider using `config.json.local` for production deployments
- Use strong RCON passwords on your Minecraft servers

## Troubleshooting

### Connection Failed
- Verify RCON is enabled in `server.properties`
- Check the RCON port is correct (default: 25575)
- Ensure the password matches exactly
- Check firewall rules allow RCON connections

### Command Execution Failed
- The command might be invalid for the server
- Server might be overloaded or experiencing lag
- Check that the player/entity exists (for commands that reference them)

### No Response
- Some commands don't return output (e.g., `op` command)
- This is normal and will show "No output from server"

## API

### MinecraftRcon Class

Located at `utils/MinecraftRcon.js`

**Methods:**
- `connect(server)`: Establish RCON connection
- `executeCommand(server, command)`: Execute a console command
- `disconnect(server)`: Close RCON connection
- `testConnection(server)`: Test if connection works
- `parseServerAddress(address)`: Parse host:port from address string

**Example:**
```javascript
import { MinecraftRcon } from './utils/MinecraftRcon.js';

const rcon = new MinecraftRcon(config);
const result = await rcon.executeCommand(
  { host: 'localhost', port: 25575, password: 'secret', address: 'localhost:25575' },
  'list'
);

console.log(result.response); // Server output
```
