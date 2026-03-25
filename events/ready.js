import { createLogger } from '../utils/Logger.js';

const logger = createLogger('ReadyEvent');

export default {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    logger.info(`Ready to serve ${client.guilds.cache.size} guilds`);
    
    client.user.setActivity('Managing voice channels', { type: 'WATCHING' });

    const config = client.tempChannelManager.config;
    if (config.controlChannelId) {
      const controlChannel = client.channels.cache.get(config.controlChannelId);
      if (controlChannel) {
        logger.info(`Control channel set: ${controlChannel.name}`);
      } else {
        logger.warn(`Control channel not found: ${config.controlChannelId}`);
      }
    }

    if (config.features?.videoNotifier && client.videoNotifierManager) {
      client.videoNotifierManager.start();
    }

    if (config.github?.enabled && client.githubNotifierManager) {
      client.githubNotifierManager.start();
    }
  }
};
