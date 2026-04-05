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

export interface XboxTitle {
  titleId: string;
  name: string;
  displayImage: string;
  titleType: string;
  devices: string[];
}

export interface OpenXblGamesResponse {
  titles: XboxTitle[];
}

export interface OpenXblSearchResponse {
  profileUsers: Array<{
    id: string;
    hostId: string;
    settings: Array<{ id: string; value: string }>;
  }>;
}
