export interface TempVoiceChannel {
  id: string;
  ownerId: string;
  guildId: string;
  createdAt: Date;
  lastEmptyAt: Date | null;
  deleteTimeout: NodeJS.Timeout | null;
  settings: VoiceChannelSettings;
}

export interface VoiceChannelSettings {
  name: string;
  userLimit: number;
  bitrate: number;
  locked: boolean;
}

export interface CreateChannelModalData {
  name: string;
  userLimit: number;
  quality: 'low' | 'normal' | 'high';
  locked: boolean;
}

export const QualityBitrateMap: Record<CreateChannelModalData['quality'], number> = {
  low: 64000,
  normal: 96000,
  high: 128000,
};
