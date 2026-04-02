import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const configPath = join(__dirname, '..', 'config.json');

export function loadConfig() {
  if (!existsSync(configPath)) {
    throw new Error('config.json not found!');
  }
  
  try {
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    throw new Error(`Failed to load config.json: ${error.message}`);
  }
}

export function getConfig() {
  return loadConfig();
}

export function saveConfig(config) {
  try {
    const configData = JSON.stringify(config, null, 2);
    writeFileSync(configPath, configData, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to save config.json: ${error.message}`);
    return false;
  }
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
