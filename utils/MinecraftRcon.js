import { createLogger } from './Logger.js';

export class MinecraftRcon {
  constructor(config) {
    this.config = config;
    this.logger = createLogger('MinecraftRcon');
    this.connections = new Map();
    this.timeout = config.rcon?.timeout || 5000;
  }

  async connect(server) {
    const key = `${server.address}:${server.port}`;
    
    if (this.connections.has(key)) {
      const existing = this.connections.get(key);
      try {
        await existing.end();
      } catch (error) {
        this.logger.warn(`Error closing existing connection: ${error.message}`);
      }
      this.connections.delete(key);
    }

    try {
      const { Rcon } = await import('rcon-client');
      
      const connection = Rcon.connect({
        host: server.host,
        port: server.port,
        password: server.password,
        timeout: this.timeout
      });

      this.connections.set(key, connection);
      
      this.logger.info(`Connected to RCON: ${server.host}:${server.port}`);
      return connection;
    } catch (error) {
      this.logger.error(`Failed to connect to RCON ${server.host}:${server.port}:`, error.message);
      throw error;
    }
  }

  async executeCommand(server, command) {
    const key = `${server.address}:${server.port}`;
    let connection = this.connections.get(key);

    if (!connection) {
      connection = await this.connect(server);
    }

    try {
      this.logger.info(`Executing command on ${server.host}:${server.port}: ${command}`);
      
      const response = await connection.send(command);
      
      this.logger.info(`Command executed successfully, response length: ${response?.length || 0} chars`);
      
      return {
        success: true,
        response: response || 'No output from server',
        server: {
          host: server.host,
          port: server.port,
          address: server.address
        },
        command
      };
    } catch (error) {
      this.logger.error(`Error executing command: ${error.message}`);
      
      this.connections.delete(key);
      
      return {
        success: false,
        error: error.message,
        server: {
          host: server.host,
          port: server.port,
          address: server.address
        },
        command
      };
    }
  }

  async disconnect(server) {
    if (!server) {
      await this.disconnectAll();
      return;
    }

    const key = `${server.address}:${server.port}`;
    const connection = this.connections.get(key);

    if (connection) {
      try {
        await connection.end();
        this.connections.delete(key);
        this.logger.info(`Disconnected from RCON: ${server.host}:${server.port}`);
      } catch (error) {
        this.logger.warn(`Error disconnecting from RCON: ${error.message}`);
        this.connections.delete(key);
      }
    }
  }

  async disconnectAll() {
    const disconnectPromises = Array.from(this.connections.entries()).map(
      async ([key, connection]) => {
        try {
          await connection.end();
          this.logger.info(`Disconnected from RCON: ${key}`);
        } catch (error) {
          this.logger.warn(`Error disconnecting from ${key}: ${error.message}`);
        }
      }
    );

    await Promise.all(disconnectPromises);
    this.connections.clear();
    this.logger.info('Disconnected from all RCON servers');
  }

  async testConnection(server) {
    try {
      await this.connect(server);
      const result = await this.executeCommand(server, 'list');
      await this.disconnect(server);
      
      return {
        success: true,
        message: 'Connection successful',
        players: result.success ? result.response : null
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  parseServerAddress(address) {
    const parts = address.split(':');

    if (parts.length > 2) {
      throw new Error('Invalid address format');
    }

    const host = parts[0];
    const port = parts.length === 2 ? parseInt(parts[1], 10) : 25575;

    if (port < 1 || port > 65535) {
      throw new Error('Invalid port number');
    }

    return { host, port };
  }

  formatServerAddress(host, port) {
    if (port && port !== 25575) {
      return `${host}:${port}`;
    }
    return host;
  }

  getSavedServers() {
    return this.config.rcon?.savedServers || [];
  }

  getServerByName(name) {
    const servers = this.getSavedServers();
    return servers.find(s => 
      s.name?.toLowerCase() === name.toLowerCase() || 
      s.address?.toLowerCase() === name.toLowerCase()
    );
  }
}
