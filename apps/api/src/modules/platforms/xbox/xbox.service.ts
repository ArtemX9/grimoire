import { Injectable } from '@nestjs/common';

import { iPlatformService } from '../common/sync-service';
import { EnqueueResult, PlatformResponse, SyncStatusResponse } from '../common/types';

@Injectable()
export class XboxService implements iPlatformService {
  constructor() {}
  connect(userID: string, username: string): Promise<PlatformResponse> {
    throw new Error('Method not implemented.');
  }
  getSyncStatus(userID: string): Promise<SyncStatusResponse> {
    throw new Error('Method not implemented.');
  }
  enqueueSync(userID: string): Promise<EnqueueResult> {
    throw new Error('Method not implemented.');
  }
}
