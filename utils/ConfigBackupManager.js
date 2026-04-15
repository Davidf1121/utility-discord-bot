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
      'config-backup.json',
      'config(old).json',
      'config(old2).json',
      'config.new.json',
      'config.new',
      'config.old2.json',
      'config.old2',
      'config.latest.json',
      'config.prev.json',
      'config.save',
      'config.bak'
    ];
  }

  isEmpty(value) {
    if (value === '' || value === null || value === undefined) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
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
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
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
    
    if (!backupConfig || typeof backupConfig !== 'object') {
      return missing;
    }

    const keys = Object.keys(backupConfig);
    
    for (const key of keys) {
      const currentPath = path ? `${path}.${key}` : key;
      const backupValue = backupConfig[key];
      const currentValue = currentConfig ? currentConfig[key] : undefined;
      
      const isMissing = currentConfig === null || currentConfig === undefined || !(key in currentConfig);
      const isCurrentEmpty = this.isEmpty(currentValue);
      const isBackupNotEmpty = !this.isEmpty(backupValue);

      if (isMissing || (isCurrentEmpty && isBackupNotEmpty)) {
        if (typeof backupValue !== 'object' || backupValue === null || Array.isArray(backupValue) || isMissing) {
          missing.push({
            path: currentPath,
            value: backupValue
          });
          
          if (isMissing || (isCurrentEmpty && isBackupNotEmpty)) {
            continue;
          }
        }
      }
      
      if (
        typeof backupValue === 'object' &&
        backupValue !== null &&
        !Array.isArray(backupValue) &&
        (isMissing || (typeof currentValue === 'object' && currentValue !== null))
      ) {
        const nestedMissing = this.findMissingKeys(
          currentValue,
          backupValue,
          currentPath
        );
        missing.push(...nestedMissing);
      } else if (
        Array.isArray(backupValue) &&
        Array.isArray(currentValue) &&
        backupValue.length === currentValue.length
      ) {
        for (let i = 0; i < backupValue.length; i++) {
          if (typeof backupValue[i] === 'object' && backupValue[i] !== null) {
            const nestedMissing = this.findMissingKeys(
              currentValue[i],
              backupValue[i],
              `${currentPath}.${i}`
            );
            missing.push(...nestedMissing);
          }
        }
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
        this.logger.info(`No migratable values found in ${backupFile}`);
        continue;
      }

      this.logger.info(`Found ${missingKeys.length} value(s) to migrate from ${backupFile}`);

      for (const { path, value } of missingKeys) {
        const existingValue = this.getNestedValue(upgradedConfig, path);
        const isMissing = existingValue === undefined;
        const isCurrentEmpty = this.isEmpty(existingValue);
        const isBackupNotEmpty = !this.isEmpty(value);

        if (isMissing || (isCurrentEmpty && isBackupNotEmpty)) {
          this.setNestedValue(upgradedConfig, path, value);
          allChanges.push({
            path,
            value: this.formatValue(value),
            source: backupFile
          });
          const action = isMissing ? 'Migrated' : 'Updated empty value';
          this.logger.info(`  [+] ${action}: ${path} = ${this.formatValue(value)}`);
        }
      }
    }

    if (allChanges.length > 0) {
      this.logger.info(`Config upgrade complete. Migrated/Updated ${allChanges.length} setting(s).`);
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
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length <= 3 && keys.length > 0) {
        return `{ ${keys.join(', ')} }`;
      }
      return keys.length === 0 ? '{}' : `{ ${keys.length} keys }`;
    }
    return String(value);
  }
}

export function createConfigBackupManager(config, logger) {
  return new ConfigBackupManager(config, logger);
}
