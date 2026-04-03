import { readFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ConfigBackupManager {
  constructor(config, logger = null) {
    this.config = config;
    this.logger = logger || createLogger('ConfigBackup');
    this.basePath = join(__dirname, '..');
    
    this.defaultBackupPatterns = [
      'config.backup.json',
      'config.old.json',
      'config.bak.json',
      'config.backup-*.json',
      'config.v*.json',
      'config(*).json',
      'config_old.json',
      'config-backup.json'
    ];
  }

  getBackupPatterns() {
    return this.config.autoUpgrade?.backupPatterns || this.defaultBackupPatterns;
  }

  scanForBackupFiles() {
    const patterns = this.getBackupPatterns();
    const foundFiles = new Set();
    
    try {
      const files = readdirSync(this.basePath);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        for (const pattern of patterns) {
          if (this.matchesPattern(file, pattern)) {
            if (file !== 'config.json') {
              foundFiles.add(file);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error scanning for backup files:', error.message);
    }
    
    return Array.from(foundFiles).sort();
  }

  matchesPattern(filename, pattern) {
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filename);
    }
    
    if (pattern.includes('(') && pattern.includes(')')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filename);
    }
    
    return filename === pattern;
  }

  loadBackupConfig(filename) {
    const filePath = join(this.basePath, filename);
    
    if (!existsSync(filePath)) {
      return null;
    }
    
    try {
      const data = readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.warn(`Failed to load backup config ${filename}:`, error.message);
      return null;
    }
  }

  findMissingKeys(currentConfig, backupConfig, path = '') {
    const missing = [];
    
    for (const key of Object.keys(backupConfig)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in currentConfig)) {
        missing.push({
          path: currentPath,
          value: backupConfig[key]
        });
      } else if (
        typeof backupConfig[key] === 'object' &&
        backupConfig[key] !== null &&
        !Array.isArray(backupConfig[key]) &&
        typeof currentConfig[key] === 'object' &&
        currentConfig[key] !== null
      ) {
        const nestedMissing = this.findMissingKeys(
          currentConfig[key],
          backupConfig[key],
          currentPath
        );
        missing.push(...nestedMissing);
      }
    }
    
    return missing;
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  upgradeConfig(currentConfig) {
    if (this.config.autoUpgrade?.enabled === false) {
      this.logger.info('Auto-upgrade is disabled, skipping backup scan');
      return { upgraded: false, changes: [] };
    }

    const backupFiles = this.scanForBackupFiles();
    
    if (backupFiles.length === 0) {
      this.logger.debug('No backup config files found');
      return { upgraded: false, changes: [] };
    }

    this.logger.info(`Found ${backupFiles.length} potential backup file(s): ${backupFiles.join(', ')}`);

    const allChanges = [];
    let upgradedConfig = JSON.parse(JSON.stringify(currentConfig));

    for (const backupFile of backupFiles) {
      const backupConfig = this.loadBackupConfig(backupFile);
      
      if (!backupConfig) {
        continue;
      }

      this.logger.info(`Checking backup file: ${backupFile}`);
      const missingKeys = this.findMissingKeys(upgradedConfig, backupConfig);

      if (missingKeys.length === 0) {
        this.logger.debug(`No missing keys found in ${backupFile}`);
        continue;
      }

      for (const { path, value } of missingKeys) {
        const existingValue = this.getNestedValue(upgradedConfig, path);
        
        if (existingValue === undefined) {
          this.setNestedValue(upgradedConfig, path, value);
          allChanges.push({
            path,
            value: this.formatValue(value),
            source: backupFile
          });
          this.logger.info(`Migrated: ${path} = ${this.formatValue(value)} (from ${backupFile})`);
        }
      }
    }

    if (allChanges.length > 0) {
      this.logger.info(`Config upgrade complete. Migrated ${allChanges.length} setting(s).`);
      return { upgraded: true, changes: allChanges, config: upgradedConfig };
    }

    return { upgraded: false, changes: [] };
  }

  getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  formatValue(value) {
    if (typeof value === 'string') {
      const str = value.length > 50 ? value.substring(0, 50) + '...' : value;
      return `"${str}"`;
    }
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      return '{...}';
    }
    return String(value);
  }
}

export function createConfigBackupManager(config, logger) {
  return new ConfigBackupManager(config, logger);
}
