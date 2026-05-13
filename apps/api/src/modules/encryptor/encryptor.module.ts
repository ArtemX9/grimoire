import { Global, Module } from '@nestjs/common';

import { EncryptorService } from './encryptor.service';

@Global()
@Module({
  providers: [EncryptorService],
  exports: [EncryptorService],
})
export class EncryptorModule {}
