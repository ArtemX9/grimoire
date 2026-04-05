export interface PlatformResponse {
  id: string;
  userId: string;
  platform: string;
  externalId: string;
  lastSyncAt?: Date;
}

export interface SyncStatusResponse {
  connected: boolean;
  lastSyncAt?: Date;
}

export interface EnqueueResult {
  queued: boolean;
  reason?: string;
}

export interface RaRecentGame {
  GameID: number;
  Title: string;
  ImageIcon: string;
  ConsoleID: number;
  ConsoleName: string;
  NumAchieved: number;
  PossibleScore: number;
  NumAchievedHardcore: number;
}
