import { EnqueueResult, PlatformResponse, SyncStatusResponse } from './types';

export interface iPlatformService {
  connect(userID: string, username?: string): Promise<PlatformResponse>;
  getSyncStatus(userID: string): Promise<SyncStatusResponse>;
  enqueueSync(userID: string): Promise<EnqueueResult>;
}
