import { Client, Events, ChannelType, VoiceChannel, GuildMember } from 'discord.js';
import { Feature } from '../Feature';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import { voiceManager } from './voiceManager';
import { setupControlChannel } from './setup';
import {
  handleButtonInteraction,
  handleModalSubmit,
  handleSelectMenuInteraction,
  handleVoiceStateUpdate,
} from './interactions';

export class TempVoiceChannelsFeature extends Feature {
  readonly name = 'TempVoiceChannels';
  readonly description = 'Creates temporary voice channels with custom configuration';
  readonly enabled = config.features.tempVoiceChannels.enabled;

  private client: Client | null = null;

  async initialize(client: Client): Promise<void> {
    this.client = client;

    // Setup control channel message
    await setupControlChannel(client);

    // Register event handlers
    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isButton()) {
          await handleButtonInteraction(interaction);
        } else if (interaction.isModalSubmit()) {
          await handleModalSubmit(interaction);
        } else if (interaction.isStringSelectMenu()) {
          await handleSelectMenuInteraction(interaction);
        }
      } catch (error) {
        logger.error('Error handling interaction:', error);

        const errorMessage = 'An error occurred while processing your request.';

        if (interaction.isRepliable()) {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
          } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
          }
        }
      }
    });

    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      const guild = oldState.guild || newState.guild;
      if (!guild) return;

      await handleVoiceStateUpdate(
        oldState.member || newState.member,
        newState.member || oldState.member,
        { channelId: oldState.channelId },
        { channelId: newState.channelId },
        guild
      );
    });

    // Handle channel deletion (cleanup if channel is manually deleted)
    client.on(Events.ChannelDelete, (channel) => {
      if (channel.type === ChannelType.GuildVoice && voiceManager.isTempChannel(channel.id)) {
        voiceManager.cleanupChannel(channel.id);
        logger.info(`Cleaned up temp channel data for manually deleted channel ${channel.id}`);
      }
    });

    // Handle guild removal (cleanup all channels for that guild)
    client.on(Events.GuildDelete, (guild) => {
      // Note: We don't have a guild-based cleanup in the current voiceManager
      // This could be added if needed
      logger.info(`Left guild ${guild.name} (${guild.id})`);
    });

    logger.info('TempVoiceChannels feature initialized');
  }

  shutdown(): void {
    // Cleanup any pending timeouts
    // The voiceManager's cleanup would need to be accessible here
    logger.info('TempVoiceChannels feature shutting down');
  }
}

export { voiceManager };
export * from './types';
