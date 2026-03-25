import { Client, Events } from 'discord.js';
import { logger } from '../utils/logger';
import { loadCommands, registerSlashCommands, setupCommandHandler } from './commandHandler';
import type { BotClient } from '../types';

export async function setupEventHandlers(client: BotClient): Promise<void> {
  // Client ready event
  client.once(Events.ClientReady, async () => {
    logger.info(`Logged in as ${client.user?.tag} (${client.user?.id})`);

    // Load and register commands
    await loadCommands(client);
    setupCommandHandler(client);

    const guildId = process.env.GUILD_ID;
    await registerSlashCommands(client, guildId);
  });

  // Guild create event (bot joins a new guild)
  client.on(Events.GuildCreate, (guild) => {
    logger.info(`Joined new guild: ${guild.name} (${guild.id})`);
  });

  // Guild delete event (bot leaves a guild)
  client.on(Events.GuildDelete, (guild) => {
    logger.info(`Left guild: ${guild.name} (${guild.id})`);
  });

  // Error handling
  client.on(Events.Error, (error) => {
    logger.error('Discord client error:', error);
  });

  client.on(Events.Warn, (info) => {
    logger.warn('Discord client warning:', info);
  });

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    client.on(Events.Debug, (info) => {
      logger.debug(info);
    });
  }
}
