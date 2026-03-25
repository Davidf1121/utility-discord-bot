import { Client, Collection, Events, ChatInputCommandInteraction } from 'discord.js';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { logger } from '../utils/logger';
import type { Command, BotClient } from '../types';

export async function loadCommands(client: BotClient): Promise<void> {
  const commandsPath = resolve(__dirname, '../commands');

  try {
    const commandFiles = readdirSync(commandsPath).filter((file) =>
      file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
      const filePath = resolve(commandsPath, file);
      const command: Command = await import(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(`Command at ${filePath} is missing required properties`);
      }
    }

    logger.info(`Loaded ${client.commands.size} commands`);
  } catch (error) {
    logger.error('Failed to load commands:', error);
  }
}

export async function registerSlashCommands(client: BotClient, guildId?: string): Promise<void> {
  try {
    const commandsData = client.commands.map((cmd) => cmd.data.toJSON());

    if (guildId) {
      // Register to specific guild (faster for development)
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        await guild.commands.set(commandsData);
        logger.info(`Registered ${commandsData.length} commands to guild ${guildId}`);
      }
    } else {
      // Register globally
      await client.application?.commands.set(commandsData);
      logger.info(`Registered ${commandsData.length} global commands`);
    }
  } catch (error) {
    logger.error('Failed to register slash commands:', error);
  }
}

export function setupCommandHandler(client: BotClient): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const commandInteraction = interaction as ChatInputCommandInteraction;
    const command = client.commands.get(commandInteraction.commandName);

    if (!command) {
      logger.warn(`No command found for ${commandInteraction.commandName}`);
      return;
    }

    try {
      await command.execute(commandInteraction);
    } catch (error) {
      logger.error(`Error executing command ${commandInteraction.commandName}:`, error);

      const errorMessage = {
        content: 'There was an error executing this command!',
        ephemeral: true,
      };

      if (commandInteraction.replied || commandInteraction.deferred) {
        await commandInteraction.followUp(errorMessage);
      } else {
        await commandInteraction.reply(errorMessage);
      }
    }
  });
}
