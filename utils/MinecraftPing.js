import { createLogger } from './Logger.js';
import { pingBedrock as pingBedrockImpl } from './MinecraftPingBedrock.js';

export class MinecraftPing {
  constructor(config) {
    this.config = config;
    this.logger = createLogger('MinecraftPing');
    this.timeout = config.mcsrv?.timeout || 5000;
  }

  async pingServer(host, port = null, type = 'java') {
    try {
      this.logger.info(`Pinging server: ${host}${port ? `:${port}` : ''} (${type})`);

      if (type === 'bedrock') {
        return await this.pingBedrock(host, port);
      } else {
        return await this.pingJava(host, port);
      }
    } catch (error) {
      this.logger.error(`Error pinging server ${host}:`, error.message);
      return {
        success: false,
        error: error.message,
        host,
        port: port || (type === 'java' ? 25565 : 19132),
        type
      };
    }
  }

  async pingJava(host, port = null) {
    const mcp = await import('@l2studio/minecraft-ping');
    const ping = mcp.default.default;
    const Server = mcp.default.Server;
    const defaultPort = 25565;
    const targetPort = port || defaultPort;

    try {
      const response = await ping(Server.JAVA, {
        host,
        port: targetPort,
        timeout: this.timeout
      });

      const result = {
        success: true,
        host,
        port: targetPort,
        type: 'java',
        online: true,
        players: {
          online: response.players?.online || 0,
          max: response.players?.max || 0,
          sample: response.players?.sample || []
        },
        version: {
          name: response.version?.name || 'Unknown',
          protocol: response.version?.protocol || 0
        },
        motd: {
          raw: response.description || '',
          html: this.formatMOTD(response.description) || '',
          clean: this.cleanMOTD(response.description) || ''
        },
        favicon: response.favicon || null,
        latency: Math.round(response.latency || 0),
        serverType: this.detectServerType(response)
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  async pingBedrock(host, port = null) {
    const defaultPort = 19132;
    const targetPort = port || defaultPort;

    try {
      const response = await pingBedrockImpl({
        host,
        port: targetPort,
        timeout: this.timeout
      });

      const result = {
        success: true,
        host,
        port: targetPort,
        type: 'bedrock',
        online: true,
        players: {
          online: response.players?.online || 0,
          max: response.players?.max || 0,
          sample: []
        },
        version: {
          name: 'Bedrock Edition',
          protocol: 0
        },
        motd: {
          raw: response.description || '',
          html: response.description || '',
          clean: response.description || ''
        },
        favicon: null,
        latency: Math.round(response.latency || 0),
        serverType: 'Bedrock',
        serverId: response.serverId || 'Unknown',
        gameId: response.gameId || 'Unknown'
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  formatMOTD(description) {
    if (!description) return '';

    if (typeof description === 'string') {
      return description;
    }

    if (Array.isArray(description)) {
      return description.map(item => this.formatMOTD(item)).join('');
    }

    if (typeof description === 'object' && description !== null) {
      if (description.text) {
        let text = description.text;

        if (description.extra) {
          text += description.extra.map(extra => this.formatMOTD(extra)).join('');
        }

        if (description.bold) text = `**${text}**`;
        if (description.italic) text = `*${text}*`;
        if (description.underlined) text = `<u>${text}</u>`;
        if (description.strikethrough) text = `~~${text}~~`;
        if (description.obfuscated) text = `||${text}||`;

        return text;
      }

      return Object.values(description)
        .map(v => this.formatMOTD(v))
        .join('');
    }

    return '';
  }

  cleanMOTD(description) {
    if (!description) return '';

    const formatted = this.formatMOTD(description);
    return formatted
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/<u>/g, '')
      .replace(/<\/u>/g, '')
      .replace(/~~/g, '')
      .replace(/\|\|/g, '')
      .replace(/§[0-9a-fk-or]/g, '')
      .replace(/§/g, '')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
  }

  detectServerType(response) {
    if (!response) return 'Unknown';

    // Check version.name first (original behavior)
    const versionName = (response.version?.name || '').toLowerCase();

    // Then check description/MOTD for server software keywords
    const cleanDescription = this.cleanMOTD(response.description || '').toLowerCase();

    // Combine both sources for detection
    const textToCheck = `${versionName} ${cleanDescription}`;

    if (textToCheck.includes('paper')) return 'Paper';
    if (textToCheck.includes('spigot')) return 'Spigot';
    if (textToCheck.includes('craftbukkit')) return 'CraftBukkit';
    if (textToCheck.includes('fabric')) return 'Fabric';
    if (textToCheck.includes('forge')) return 'Forge';
    if (textToCheck.includes('sponge')) return 'Sponge';
    if (textToCheck.includes('velocity')) return 'Velocity';
    if (textToCheck.includes('bungeecord')) return 'BungeeCord';
    if (textToCheck.includes('waterfall')) return 'Waterfall';
    if (textToCheck.includes('purpur')) return 'Purpur';
    if (textToCheck.includes('pufferfish')) return 'Pufferfish';
    if (textToCheck.includes('tuinity')) return 'Tuinity';
    if (textToCheck.includes('yatopia')) return 'Yatopia';
    if (textToCheck.includes('mohist')) return 'Mohist';
    if (textToCheck.includes('catserver')) return 'CatServer';
    if (textToCheck.includes('kettle')) return 'Kettle';

    return 'Vanilla';
  }

  formatServerAddress(host, port, type) {
    const defaultPort = type === 'java' ? 25565 : 19132;
    if (port && port !== defaultPort) {
      return `${host}:${port}`;
    }
    return host;
  }

  getServerIcon(result) {
    if (!result.favicon) {
      return null;
    }

    try {
      const base64Data = result.favicon.replace(/^data:image\/png;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      return null;
    }
  }

  createPingEmbed(result, config) {
    const colors = config.embedColors || {};
    const colorsMcsrv = config.mcsrv?.embedColors || {};

    // Handle null/undefined result
    if (!result) {
      return {
        embed: {
          color: colorsMcsrv.offline || colors.error || 15548997,
          title: '❌ Server Error',
          description: 'Could not retrieve server information',
          fields: [],
          timestamp: new Date()
        },
        iconBuffer: null
      };
    }

    // Ensure all result fields have defaults
    const safeResult = {
      success: result.success || false,
      host: result.host || 'Unknown',
      port: result.port || null,
      type: result.type || 'java',
      error: result.error || 'Unknown error',
      motd: {
        clean: result.motd?.clean || 'No MOTD'
      },
      players: {
        online: result.players?.online ?? 0,
        max: result.players?.max ?? 0,
        sample: result.players?.sample || []
      },
      version: {
        name: result.version?.name || 'Unknown'
      },
      latency: result.latency ?? 0,
      serverType: result.serverType || 'Unknown',
      favicon: result.favicon || null,
      gameId: result.gameId || null,
      serverId: result.serverId || null
    };

    if (!safeResult.success) {
      return {
        embed: {
          color: colorsMcsrv.offline || colors.mcsrv || colors.error || 15548997,
          title: `❌ ${safeResult.host}${safeResult.port ? `:${safeResult.port}` : ''}`,
          description: 'Server is offline or unreachable',
          fields: [
            { name: 'Error', value: String(safeResult.error), inline: false },
            { name: 'Address', value: `${safeResult.host}:${safeResult.port || 'N/A'}`, inline: true },
            { name: 'Type', value: safeResult.type === 'java' ? '☕ Java' : '📱 Bedrock', inline: true }
          ],
          timestamp: new Date()
        },
        iconBuffer: null
      };
    }

    const iconBuffer = this.getServerIcon(safeResult);
    const iconUrl = iconBuffer ? `attachment://icon.png` : null;

    const embed = {
      color: colorsMcsrv.online || colors.mcsrv || colors.success || 5793287,
      title: `✅ ${this.formatServerAddress(safeResult.host, safeResult.port, safeResult.type)}`,
      description: String(safeResult.motd.clean || 'Server Online'),
      thumbnail: iconUrl ? { url: iconUrl } : null,
      fields: [
        {
          name: '👥 Players',
          value: `${safeResult.players.online}/${safeResult.players.max}`,
          inline: true
        },
        {
          name: '📡 Latency',
          value: `${safeResult.latency}ms`,
          inline: true
        },
        {
          name: '🎮 Version',
          value: String(safeResult.version.name),
          inline: false
        },
        {
          name: '🏷️ Server Type',
          value: String(safeResult.serverType),
          inline: true
        },
        {
          name: '🔧 Platform',
          value: safeResult.type === 'java' ? '☕ Java Edition' : '📱 Bedrock Edition',
          inline: true
        }
      ],
      timestamp: new Date()
    };

    if (safeResult.type === 'bedrock') {
      if (safeResult.gameId && safeResult.gameId !== 'Unknown') {
        embed.fields.push({
          name: '🎮 Game',
          value: String(safeResult.gameId),
          inline: true
        });
      }
      if (safeResult.serverId && safeResult.serverId !== 'Unknown') {
        embed.fields.push({
          name: '🆔 Server ID',
          value: String(safeResult.serverId),
          inline: true
        });
      }
    }

    if (safeResult.players.sample && safeResult.players.sample.length > 0) {
      const playerList = safeResult.players.sample
        .slice(0, 5)
        .map(p => p.name || 'Unknown')
        .join(', ');
      if (playerList) {
        embed.fields.push({
          name: '👤 Sample Players',
          value: playerList + (safeResult.players.sample.length > 5 ? '...' : ''),
          inline: false
        });
      }
    }

    return { embed, iconBuffer };
  }
}
