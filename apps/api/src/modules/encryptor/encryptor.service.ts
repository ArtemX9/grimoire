import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { decrypt, encrypt } from '../../common/utils/encryptor';

@Injectable()
export class EncryptorService {
  private readonly key: string;

  constructor(private config: ConfigService) {
    this.key = this.config.getOrThrow<string>('app.encryptionKey');
  }

  encrypt(plain: string) {
    return encrypt(plain, this.key);
  }
  decrypt(stored: string) {
    return decrypt(stored, this.key);
  }
}
