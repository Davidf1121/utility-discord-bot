import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createConfigBackupManager } from './ConfigBackupManager.js';
import { createLogger } from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const configPath = join(__dirname, '..', 'config.json');

export function loadConfig() {
  if (!existsSync(configPath)) {
    throw new Error('config.json not found!');
  }
  
  try {
    const configData = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    // Ensure all Discord IDs are strings to avoid precision issues
    if (config.clientId) config.clientId = String(config.clientId);
    if (config.guildId) config.guildId = String(config.guildId);
    if (config.controlChannelId) config.controlChannelId = String(config.controlChannelId);
    if (config.voiceCategoryId) config.voiceCategoryId = String(config.voiceCategoryId);
    
    if (config.ticketSystem) {
      if (config.ticketSystem.ticketCategoryId) {
        config.ticketSystem.ticketCategoryId = String(config.ticketSystem.ticketCategoryId);
      }
      if (Array.isArray(config.ticketSystem.ticketStaffRoles)) {
        config.ticketSystem.ticketStaffRoles = config.ticketSystem.ticketStaffRoles.map(id => String(id));
      }
    }
    
    if (config.autoModeration && config.autoModeration.logChannelId) {
      config.autoModeration.logChannelId = String(config.autoModeration.logChannelId);
    }
    
    if (config.videoNotifier) {
      if (config.videoNotifier.notificationChannelId) {
        config.videoNotifier.notificationChannelId = String(config.videoNotifier.notificationChannelId);
      }
      if (config.videoNotifier.youtubeNotificationChannelId) {
        config.videoNotifier.youtubeNotificationChannelId = String(config.videoNotifier.youtubeNotificationChannelId);
      }
      if (config.videoNotifier.tiktokNotificationChannelId) {
        config.videoNotifier.tiktokNotificationChannelId = String(config.videoNotifier.tiktokNotificationChannelId);
      }
    }
    
    if (config.github && config.github.notificationChannelId) {
      config.github.notificationChannelId = String(config.github.notificationChannelId);
    }
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load config.json: ${error.message}`);
  }
}

export function loadConfigWithUpgrade() {
  const config = loadConfig();
  const logger = createLogger('ConfigLoader');
  
  try {
    const backupManager = createConfigBackupManager(config, logger);
    const result = backupManager.upgradeConfig(config);
    
    if (result.upgraded && result.config) {
      logger.info(`Config auto-upgraded with ${result.changes.length} change(s)`);
      saveConfig(result.config);
      return result.config;
    }
  } catch (error) {
    logger.error('Error during config upgrade:', error.message);
  }
  
  return config;
}

export function getConfig() {
  return loadConfig();
}

export function saveConfig(config) {
  try {
    // Ensure all Discord IDs are strings before saving
    if (config.clientId) config.clientId = String(config.clientId);
    if (config.guildId) config.guildId = String(config.guildId);
    if (config.controlChannelId) config.controlChannelId = String(config.controlChannelId);
    if (config.voiceCategoryId) config.voiceCategoryId = String(config.voiceCategoryId);
    
    if (config.ticketSystem) {
      if (config.ticketSystem.ticketCategoryId) {
        config.ticketSystem.ticketCategoryId = String(config.ticketSystem.ticketCategoryId);
      }
      if (Array.isArray(config.ticketSystem.ticketStaffRoles)) {
        config.ticketSystem.ticketStaffRoles = config.ticketSystem.ticketStaffRoles.map(id => String(id));
      }
    }
    
    if (config.autoModeration && config.autoModeration.logChannelId) {
      config.autoModeration.logChannelId = String(config.autoModeration.logChannelId);
    }
    
    if (config.videoNotifier) {
      if (config.videoNotifier.notificationChannelId) {
        config.videoNotifier.notificationChannelId = String(config.videoNotifier.notificationChannelId);
      }
      if (config.videoNotifier.youtubeNotificationChannelId) {
        config.videoNotifier.youtubeNotificationChannelId = String(config.videoNotifier.youtubeNotificationChannelId);
      }
      if (config.videoNotifier.tiktokNotificationChannelId) {
        config.videoNotifier.tiktokNotificationChannelId = String(config.videoNotifier.tiktokNotificationChannelId);
      }
    }
    
    if (config.github && config.github.notificationChannelId) {
      config.github.notificationChannelId = String(config.github.notificationChannelId);
    }

    const configData = JSON.stringify(config, null, 2);
    writeFileSync(configPath, configData, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to save config.json: ${error.message}`);
    return false;
  }
}

export function getDefaultThumbnail(config, client) {
  if (config.defaultEmbedThumbnail) {
    return config.defaultEmbedThumbnail;
  }
  return client.user.displayAvatarURL();
}

export function reloadConfig() {
  try {
    const configData = readFileSync(configPath, 'utf-8');
    const newConfig = JSON.parse(configData);
    console.log('Config reloaded successfully');
    return newConfig;
  } catch (error) {
    console.error(`Failed to reload config.json: ${error.message}`);
    return null;
  }
}
