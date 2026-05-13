import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';

import { EncryptorService } from './encryptor.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A valid 256-bit key expressed as 64 hex characters.
const VALID_KEY = 'c'.repeat(64);

function makeModule(key: string | undefined) {
  return Test.createTestingModule({
    providers: [
      EncryptorService,
      {
        provide: ConfigService,
        useValue: {
          getOrThrow: jest.fn((configKey: string) => {
            if (configKey === 'app.encryptionKey') {
              if (key === undefined) throw new Error('Missing app.encryptionKey');
              return key;
            }
            throw new Error(`Unexpected config key: ${configKey}`);
          }),
        },
      },
    ],
  }).compile();
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('EncryptorService', () => {
  let service: EncryptorService;

  beforeEach(async () => {
    const module: TestingModule = await makeModule(VALID_KEY);
    service = module.get<EncryptorService>(EncryptorService);
  });

  // ---------------------------------------------------------------------------
  // Bootstrapping
  // ---------------------------------------------------------------------------

  describe('initialization', () => {
    it('resolves successfully when the encryption key is present in config', () => {
      expect(service).toBeDefined();
    });

    it('throws during module compilation when the encryption key is missing', async () => {
      await expect(makeModule(undefined)).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // encrypt / decrypt round-trip
  // ---------------------------------------------------------------------------

  describe('encrypt + decrypt', () => {
    it('decrypts back to the original plaintext', () => {
      const plain = 'my-secret-refresh-token';
      const stored = service.encrypt(plain);
      expect(service.decrypt(stored)).toBe(plain);
    });

    it('handles an empty string round-trip', () => {
      const stored = service.encrypt('');
      expect(service.decrypt(stored)).toBe('');
    });

    it('handles a string with special characters', () => {
      const plain = 'token=abc!@#$&+';
      const stored = service.encrypt(plain);
      expect(service.decrypt(stored)).toBe(plain);
    });

    it('produces a different stored value on each call due to random IV', () => {
      const plain = 'same-value';
      const first = service.encrypt(plain);
      const second = service.encrypt(plain);
      expect(first).not.toBe(second);
    });
  });

  // ---------------------------------------------------------------------------
  // Stored format
  // ---------------------------------------------------------------------------

  describe('stored format', () => {
    it('stores data in iv:tag:ciphertext format (three colon-separated hex segments)', () => {
      const stored = service.encrypt('test');
      const parts = stored.split(':');
      expect(parts).toHaveLength(3);
    });

    it('all three segments are valid hex strings', () => {
      const stored = service.encrypt('test');
      const parts = stored.split(':');
      for (const part of parts) {
        expect(part).toMatch(/^[0-9a-f]+$/);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Tamper resistance
  // ---------------------------------------------------------------------------

  describe('tamper resistance', () => {
    it('throws when the stored value has been tampered with', () => {
      const stored = service.encrypt('data');
      // Corrupt the last character
      const tampered = stored.slice(0, -1) + (stored.endsWith('0') ? '1' : '0');
      expect(() => service.decrypt(tampered)).toThrow();
    });
  });
});
