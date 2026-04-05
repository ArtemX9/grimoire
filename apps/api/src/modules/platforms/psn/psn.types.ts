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

export interface PsnTitle {
  npTitleId: string;
  titleName: string;
  imageUrl: string;
  category: string;
  playCount: number;
  firstPlayedDateTime: string;
  lastPlayedDateTime: string;
}
