import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  AnySelectMenuInteraction,
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface Feature {
  name: string;
  description: string;
  enabled: boolean;
  initialize: (client: Client) => Promise<void> | void;
  shutdown?: () => Promise<void> | void;
}

export interface InteractionHandler {
  customId: string | RegExp;
  execute: (
    interaction:
      | ModalSubmitInteraction
      | ButtonInteraction
      | AnySelectMenuInteraction
  ) => Promise<void>;
}

export interface BotClient extends Client {
  commands: Collection<string, Command>;
  features: Collection<string, Feature>;
  interactionHandlers: Collection<string, InteractionHandler>;
}

export interface TempVoiceChannel {
  id: string;
  ownerId: string;
  guildId: string;
  createdAt: Date;
  lastEmptyAt: Date | null;
  deleteTimeout: NodeJS.Timeout | null;
}

export interface VoiceChannelSettings {
  name: string;
  userLimit: number;
  bitrate: number;
  locked: boolean;
}
