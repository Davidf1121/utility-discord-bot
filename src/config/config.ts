import { readFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';

const ActivityTypeSchema = z.enum([
  'PLAYING',
  'STREAMING',
  'LISTENING',
  'WATCHING',
  'COMPETING',
]);

const ButtonStyleSchema = z.enum([
  'Primary',
  'Secondary',
  'Success',
  'Danger',
]);

const ConfigSchema = z.object({
  bot: z.object({
    name: z.string(),
    description: z.string(),
    activity: z.object({
      type: ActivityTypeSchema,
      text: z.string(),
    }),
  }),
  features: z.object({
    tempVoiceChannels: z.object({
      enabled: z.boolean(),
      controlChannelId: z.string(),
      voiceCategoryId: z.string(),
      defaultSettings: z.object({
        name: z.string(),
        userLimit: z.number().min(1).max(99),
        bitrate: z.number().min(8000).max(384000),
        locked: z.boolean(),
      }),
      cleanup: z.object({
        emptyChannelTimeoutMs: z.number().min(0),
        maxChannelsPerUser: z.number().min(1),
      }),
      ui: z.object({
        buttonLabel: z.string(),
        buttonEmoji: z.string(),
        buttonStyle: ButtonStyleSchema,
        embedTitle: z.string(),
        embedDescription: z.string(),
        embedColor: z.number(),
      }),
    }),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'verbose', 'debug', 'silly']),
    console: z.boolean(),
    file: z.object({
      enabled: z.boolean(),
      path: z.string(),
      maxFiles: z.number(),
      maxSize: z.string(),
    }),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const configPath = resolve(process.cwd(), 'config.json');

  try {
    const configFile = readFileSync(configPath, 'utf-8');
    const parsedConfig = JSON.parse(configFile);
    return ConfigSchema.parse(parsedConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Config validation errors:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Failed to load config:', error);
    }
    process.exit(1);
  }
}

export const config = loadConfig();
