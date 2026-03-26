import { createLogger } from './Logger.js';

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
        serverType: this.detectServerType(response.version?.name || '')
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  async pingBedrock(host, port = null) {
    const mcp = await import('@l2studio/minecraft-ping');
    const ping = mcp.default.default;
    const Server = mcp.default.Server;
    const defaultPort = 19132;
    const targetPort = port || defaultPort;

    try {
      const response = await ping(Server.BEDROCK, {
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

  detectServerType(versionString) {
    if (!versionString) return 'Unknown';

    const version = versionString.toLowerCase();

    if (version.includes('paper')) return 'Paper';
    if (version.includes('spigot')) return 'Spigot';
    if (version.includes('craftbukkit')) return 'CraftBukkit';
    if (version.includes('fabric')) return 'Fabric';
    if (version.includes('forge')) return 'Forge';
    if (version.includes('sponge')) return 'Sponge';
    if (version.includes('velocity')) return 'Velocity';
    if (version.includes('bungeecord')) return 'BungeeCord';
    if (version.includes('waterfall')) return 'Waterfall';
    if (version.includes('purpur')) return 'Purpur';
    if (version.includes('pufferfish')) return 'Pufferfish';
    if (version.includes('tuinity')) return 'Tuinity';
    if (version.includes('yatopia')) return 'Yatopia';
    if (version.includes('mohist')) return 'Mohist';
    if (version.includes('catserver')) return 'CatServer';
    if (version.includes('kettle')) return 'Kettle';

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

    if (!result.success) {
      return {
        color: colorsMcsrv.offline || colors.error || 15548997,
        title: `❌ ${result.host}${result.port ? `:${result.port}` : ''}`,
        description: 'Server is offline or unreachable',
        fields: [
          { name: 'Error', value: result.error || 'Unknown error', inline: false },
          { name: 'Address', value: `${result.host}:${result.port}`, inline: true },
          { name: 'Type', value: result.type === 'java' ? '☕ Java' : '📱 Bedrock', inline: true }
        ],
        timestamp: new Date()
      };
    }

    const iconBuffer = this.getServerIcon(result);
    const iconUrl = iconBuffer ? `attachment://icon.png` : null;

    const embed = {
      color: colorsMcsrv.online || colors.success || 5793287,
      title: `✅ ${this.formatServerAddress(result.host, result.port, result.type)}`,
      description: result.motd.clean || 'Server Online',
      thumbnail: iconUrl ? { url: iconUrl } : null,
      fields: [
        {
          name: '👥 Players',
          value: `${result.players.online}/${result.players.max}`,
          inline: true
        },
        {
          name: '📡 Latency',
          value: `${result.latency}ms`,
          inline: true
        },
        {
          name: '🎮 Version',
          value: result.version.name,
          inline: false
        },
        {
          name: '🏷️ Server Type',
          value: result.serverType,
          inline: true
        },
        {
          name: '🔧 Platform',
          value: result.type === 'java' ? '☕ Java Edition' : '📱 Bedrock Edition',
          inline: true
        }
      ],
      timestamp: new Date()
    };

    if (result.type === 'bedrock') {
      if (result.gameId && result.gameId !== 'Unknown') {
        embed.fields.push({
          name: '🎮 Game',
          value: result.gameId,
          inline: true
        });
      }
      if (result.serverId && result.serverId !== 'Unknown') {
        embed.fields.push({
          name: '🆔 Server ID',
          value: result.serverId,
          inline: true
        });
      }
    }

    if (result.players.sample && result.players.sample.length > 0) {
      const playerList = result.players.sample
        .slice(0, 5)
        .map(p => p.name)
        .join(', ');
      embed.fields.push({
        name: '👤 Sample Players',
        value: playerList + (result.players.sample.length > 5 ? '...' : ''),
        inline: false
      });
    }

    return { embed, iconBuffer };
  }
}
