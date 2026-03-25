import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { readFileSync } from 'fs';
import { loadConfig } from './utils/ConfigLoader.js';
import { createLogger } from './utils/Logger.js';
import { TempChannelManager } from './utils/TempChannelManager.js';
import { VideoNotifierManager } from './utils/VideoNotifierManager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = loadConfig();
const logger = createLogger('Bot');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();

const tempChannelManager = new TempChannelManager(client, config);
const videoNotifierManager = new VideoNotifierManager(client, config);

client.tempChannelManager = tempChannelManager;
client.videoNotifierManager = videoNotifierManager;

async function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  try {
    const eventFiles = await import('./utils/fileLoader.js');
    const eventFilenames = eventFiles.loadFiles(eventsPath, '.js');
    
    for (const file of eventFilenames) {
      const filePath = path.join(eventsPath, file);
      const eventModule = await import(`file://${filePath.replace(/\\/g, '/')}`);
      const event = eventModule.default;
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      logger.info(`Loaded event: ${event.name}`);
    }
  } catch (error) {
    logger.error('Error loading events:', error);
  }
}

async function loadComponents() {
  const componentsPath = path.join(__dirname, 'components');
  try {
    const { loadFiles } = await import('./utils/fileLoader.js');
    const componentFiles = loadFiles(componentsPath, '.js');
    
    for (const file of componentFiles) {
      const filePath = path.join(componentsPath, file);
      const componentModule = await import(`file://${filePath.replace(/\\/g, '/')}`);
      const component = componentModule.default;
      
      if (component.customId) {
        client.components = client.components || new Collection();
        client.components.set(component.customId, component);
        logger.info(`Loaded component: ${component.customId}`);
      }
    }
  } catch (error) {
    logger.error('Error loading components:', error);
  }
}

async function deployCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commands = [];
  
  try {
    const { loadFiles } = await import('./utils/fileLoader.js');
    const commandFiles = loadFiles(commandsPath, '.js');
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const commandModule = await import(`file://${filePath.replace(/\\/g, '/')}`);
      const command = commandModule.default;
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        logger.info(`Loaded command: ${command.data.name}`);
      }
    }
    
    if (config.clientId && config.guildId) {
      const rest = new REST().setToken(process.env.DISCORD_TOKEN);
      
      try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);
        
        await rest.put(
          Routes.applicationGuildCommands(config.clientId, config.guildId),
          { body: commands }
        );
        
        logger.info(`Successfully reloaded ${commands.length} application (/) commands.`);
      } catch (error) {
        logger.error('Error deploying commands:', error);
      }
    } else {
      logger.warn('clientId or guildId not set in config.json, skipping command deployment');
    }
  } catch (error) {
    logger.error('Error loading commands:', error);
  }
}

async function main() {
  if (!process.env.DISCORD_TOKEN) {
    logger.error('DISCORD_TOKEN environment variable is not set!');
    process.exit(1);
  }
  
  await loadEvents();
  await loadComponents();
  await deployCommands();
  
  client.login(process.env.DISCORD_TOKEN);
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
