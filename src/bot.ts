import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PresenceUpdateStatus,
  Collection,
} from 'discord.js';
import { config } from './config/config';
import { logger } from './utils/logger';
import { loadFeatures, unloadFeatures } from './features';
import type { BotClient } from './types';

const activityTypeMap: Record<string, ActivityType> = {
  PLAYING: ActivityType.Playing,
  STREAMING: ActivityType.Streaming,
  LISTENING: ActivityType.Listening,
  WATCHING: ActivityType.Watching,
  COMPETING: ActivityType.Competing,
};

export function createBotClient(): BotClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel, Partials.GuildMember],
  }) as BotClient;

  client.commands = new Collection();
  client.features = new Collection();
  client.interactionHandlers = new Collection();

  return client;
}

export async function initializeBot(client: BotClient): Promise<void> {
  // Load features
  await loadFeatures(client);

  // Set bot activity
  const activityConfig = config.bot.activity;
  client.user?.setActivity(activityConfig.text, {
    type: activityTypeMap[activityConfig.type],
  });

  logger.info(`Bot initialized as ${client.user?.tag}`);
}

export async function shutdownBot(client: BotClient, code = 0): Promise<void> {
  logger.info('Shutting down bot...');

  await unloadFeatures();

  client.destroy();
  logger.info('Bot shut down successfully');

  process.exit(code);
}

export function setupProcessHandlers(client: BotClient): void {
  process.on('SIGINT', () => shutdownBot(client));
  process.on('SIGTERM', () => shutdownBot(client));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdownBot(client, 1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}
