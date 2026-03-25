import 'dotenv/config';
import { Events } from 'discord.js';
import { createBotClient, initializeBot, setupProcessHandlers } from './bot';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    logger.error('BOT_TOKEN environment variable is required');
    logger.info('Please create a .env file based on .env.example and set your bot token');
    process.exit(1);
  }

  const client = createBotClient();

  client.once(Events.ClientReady, async () => {
    try {
      await initializeBot(client);
      logger.info('Bot is ready and running!');
    } catch (error) {
      logger.error('Failed to initialize bot:', error);
      process.exit(1);
    }
  });

  client.on(Events.Error, (error) => {
    logger.error('Discord client error:', error);
  });

  client.on(Events.Warn, (info) => {
    logger.warn('Discord client warning:', info);
  });

  client.on(Events.Debug, (info) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(info);
    }
  });

  setupProcessHandlers(client);

  try {
    await client.login(token);
  } catch (error) {
    logger.error('Failed to login:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Fatal error in main:', error);
  process.exit(1);
});
