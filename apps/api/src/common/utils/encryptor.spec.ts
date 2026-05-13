import { decrypt, encrypt } from './encryptor';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A valid 256-bit key expressed as 64 hex characters.
const TEST_KEY = 'a'.repeat(64);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('encryptor utils', () => {
  // ---------------------------------------------------------------------------
  // encrypt / decrypt round-trip
  // ---------------------------------------------------------------------------

  describe('encrypt + decrypt round-trip', () => {
    it('decrypts back to the original plaintext', () => {
      const plain = 'hello world';
      const stored = encrypt(plain, TEST_KEY);
      expect(decrypt(stored, TEST_KEY)).toBe(plain);
    });

    it('handles an empty string', () => {
      const stored = encrypt('', TEST_KEY);
      expect(decrypt(stored, TEST_KEY)).toBe('');
    });

    it('handles a long string with special characters', () => {
      const plain = 'refresh_token=abc123!@#$%^&*()_+{}|:"<>?';
      const stored = encrypt(plain, TEST_KEY);
      expect(decrypt(stored, TEST_KEY)).toBe(plain);
    });

    it('handles unicode characters', () => {
      const plain = '日本語テスト 🎮';
      const stored = encrypt(plain, TEST_KEY);
      expect(decrypt(stored, TEST_KEY)).toBe(plain);
    });
  });

  // ---------------------------------------------------------------------------
  // Stored format
  // ---------------------------------------------------------------------------

  describe('stored format', () => {
    it('produces a string with three colon-separated hex segments (iv:tag:ciphertext)', () => {
      const stored = encrypt('test', TEST_KEY);
      const parts = stored.split(':');
      expect(parts).toHaveLength(3);
    });

    it('encodes the IV as 24 hex characters (12 bytes)', () => {
      const stored = encrypt('test', TEST_KEY);
      const [ivHex] = stored.split(':');
      expect(ivHex).toHaveLength(24);
      expect(ivHex).toMatch(/^[0-9a-f]+$/);
    });

    it('encodes the GCM auth tag as 32 hex characters (16 bytes)', () => {
      const stored = encrypt('test', TEST_KEY);
      const [, tagHex] = stored.split(':');
      expect(tagHex).toHaveLength(32);
      expect(tagHex).toMatch(/^[0-9a-f]+$/);
    });

    it('produces a different ciphertext each call due to a random IV', () => {
      const plain = 'same plaintext';
      const first = encrypt(plain, TEST_KEY);
      const second = encrypt(plain, TEST_KEY);
      expect(first).not.toBe(second);
    });
  });

  // ---------------------------------------------------------------------------
  // Tamper detection
  // ---------------------------------------------------------------------------

  describe('tamper detection', () => {
    it('throws when the ciphertext portion is modified', () => {
      const stored = encrypt('sensitive data', TEST_KEY);
      const [iv, tag, ciphertext] = stored.split(':');
      // Flip the last character of the ciphertext hex
      const flipped = ciphertext.slice(0, -1) + (ciphertext.endsWith('0') ? '1' : '0');
      const tampered = `${iv}:${tag}:${flipped}`;
      expect(() => decrypt(tampered, TEST_KEY)).toThrow();
    });

    it('throws when decrypted with a different key', () => {
      const stored = encrypt('data', TEST_KEY);
      const differentKey = 'b'.repeat(64);
      expect(() => decrypt(stored, differentKey)).toThrow();
    });
  });
});
