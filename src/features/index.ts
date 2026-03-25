import { Client } from 'discord.js';
import { Feature } from './Feature';
import { TempVoiceChannelsFeature } from './tempVoiceChannels';
import { logger } from '../utils/logger';

const features: Feature[] = [new TempVoiceChannelsFeature()];

export async function loadFeatures(client: Client): Promise<void> {
  logger.info('Loading features...');

  for (const feature of features) {
    if (feature.enabled) {
      try {
        await feature.initialize(client);
        logger.info(`✓ Feature loaded: ${feature.name}`);
      } catch (error) {
        logger.error(`✗ Failed to load feature ${feature.name}:`, error);
      }
    } else {
      logger.info(`○ Feature disabled: ${feature.name}`);
    }
  }

  logger.info('Feature loading complete');
}

export async function unloadFeatures(): Promise<void> {
  logger.info('Unloading features...');

  for (const feature of features) {
    if (feature.enabled && feature.shutdown) {
      try {
        await feature.shutdown();
        logger.info(`✓ Feature unloaded: ${feature.name}`);
      } catch (error) {
        logger.error(`✗ Failed to unload feature ${feature.name}:`, error);
      }
    }
  }
}

export { Feature, TempVoiceChannelsFeature };
