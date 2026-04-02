import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { IgdbService } from './igdb.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIgdbGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1942,
    name: 'The Witcher 3: Wild Hunt',
    cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/co1r76.jpg' },
    genres: [{ name: 'Role-playing (RPG)' }, { name: 'Adventure' }],
    summary: 'An open world action RPG.',
    first_release_date: 1431648000,
    total_rating: 93.5,
    ...overrides,
  };
}

/** Build a minimal fetch-compatible Response mock. */
function makeJsonFetchResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(data),
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('IgdbService', () => {
  let service: IgdbService;
  let mockFetch: jest.Mock;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'app.igdb.clientId': 'test-client-id',
        'app.igdb.clientSecret': 'test-client-secret',
      };
      return map[key] ?? null;
    }),
  };

  beforeEach(async () => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Queue the Twitch token response that onModuleInit will consume.
    mockFetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        access_token: 'test-access-token',
        expires_in: 3600,
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IgdbService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<IgdbService>(IgdbService);

    // NOTE: Test.createTestingModule compile() does NOT automatically call
    // onModuleInit — that only happens when the full NestJS app boots.  We
    // must trigger it manually so the token is fetched and tokenExpiry is set.
    await service.onModuleInit();

    // Reset call history so each test starts with a clean slate.
    // clearAllMocks clears .mock.calls / .instances / .results but leaves
    // implementations intact, so mockConfig.get still works correctly.
    jest.clearAllMocks();
    // Re-assign after clearAllMocks so global.fetch still points to our spy.
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // onModuleInit / refreshToken
  // ---------------------------------------------------------------------------

  describe('onModuleInit', () => {
    it('requests a Twitch OAuth token on initialisation', async () => {
      // Create a fresh module so we can observe the very first token fetch.
      const initFetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          access_token: 'fresh-token',
          expires_in: 7200,
        }),
      });
      global.fetch = initFetch;

      const freshModule = await Test.createTestingModule({
        providers: [
          IgdbService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const freshService = freshModule.get<IgdbService>(IgdbService);
      await freshService.onModuleInit();

      // One call: the Twitch token request.
      expect(initFetch).toHaveBeenCalledTimes(1);
      expect(initFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://id.twitch.tv/oauth2/token'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('embeds the client_id and client_secret in the token URL', async () => {
      const initFetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ access_token: 't', expires_in: 10 }),
      });
      global.fetch = initFetch;

      const freshModule = await Test.createTestingModule({
        providers: [
          IgdbService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      await freshModule.get<IgdbService>(IgdbService).onModuleInit();

      const url: string = initFetch.mock.calls[0][0];
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('client_secret=test-client-secret');
    });

    it('stores the access token and a future expiry after a successful token fetch', async () => {
      expect((service as any).accessToken).toBe('test-access-token');
      expect((service as any).tokenExpiry).toBeGreaterThan(Date.now());
    });
  });

  // ---------------------------------------------------------------------------
  // search
  // ---------------------------------------------------------------------------

  describe('search', () => {
    it('returns an array of IGDB games matching the query', async () => {
      const games = [makeIgdbGame(), makeIgdbGame({ id: 2, name: 'Cyberpunk 2077' })];
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse(games));

      const result = await service.search('witcher');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('The Witcher 3: Wild Hunt');
    });

    it('posts to the correct IGDB games endpoint', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([]));

      await service.search('halo');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.igdb.com/v4/games',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('sends the search term and default limit of 10 in the request body', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([]));

      await service.search('halo');

      const body: string = (mockFetch.mock.calls[0][1] as { body: string }).body;
      expect(body).toContain('search "halo"');
      expect(body).toContain('limit 10');
    });

    it('respects a custom limit when provided', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([]));

      await service.search('doom', 5);

      const body: string = (mockFetch.mock.calls[0][1] as { body: string }).body;
      expect(body).toContain('limit 5');
    });

    it('includes the Bearer token and Client-ID headers', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([]));

      await service.search('test');

      const headers = (mockFetch.mock.calls[0][1] as { headers: Record<string, string> }).headers;
      expect(headers['Authorization']).toBe('Bearer test-access-token');
      expect(headers['Client-ID']).toBe('test-client-id');
    });

    it('returns an empty array when IGDB returns no results', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([]));

      const result = await service.search('xyznonexistent');

      expect(result).toEqual([]);
    });

    it('refreshes the token when it has expired before making the API call', async () => {
      // Force the stored token to appear expired.
      (service as any).tokenExpiry = Date.now() - 1000;

      // First call: token refresh; second call: IGDB search.
      mockFetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ access_token: 'new-token', expires_in: 3600 }),
        })
        .mockResolvedValueOnce(makeJsonFetchResponse([makeIgdbGame()]));

      await service.search('test');

      // Two fetch calls: one refresh + one IGDB.
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // The IGDB call (index 1) should carry the freshly refreshed token.
      const igdbHeaders = (mockFetch.mock.calls[1][1] as { headers: Record<string, string> }).headers;
      expect(igdbHeaders['Authorization']).toBe('Bearer new-token');
    });

    it('does not call fetch for a token refresh when the token is still valid', async () => {
      // Ensure the token is definitely still valid.
      (service as any).tokenExpiry = Date.now() + 9999999;
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([]));

      await service.search('test');

      // Only one fetch call — the IGDB search, no refresh.
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------

  describe('findById', () => {
    it('returns the first element from the IGDB response array', async () => {
      const game = makeIgdbGame({ id: 1942 });
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([game]));

      const result = await service.findById(1942);

      expect(result.id).toBe(1942);
      expect(result.name).toBe('The Witcher 3: Wild Hunt');
    });

    it('posts the correct where clause containing the game ID', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([makeIgdbGame()]));

      await service.findById(1942);

      const body: string = (mockFetch.mock.calls[0][1] as { body: string }).body;
      expect(body).toContain('where id = 1942');
    });

    it('returns undefined when IGDB returns an empty array for the given id', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([]));

      const result = await service.findById(999999);

      // Implementation returns data[0] which is undefined for an empty array.
      expect(result).toBeUndefined();
    });

    it('requests all required fields in the query body', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([makeIgdbGame()]));

      await service.findById(1);

      const body: string = (mockFetch.mock.calls[0][1] as { body: string }).body;
      expect(body).toContain('id');
      expect(body).toContain('name');
      expect(body).toContain('cover.url');
      expect(body).toContain('genres.name');
      expect(body).toContain('total_rating');
    });

    it('posts to the IGDB games endpoint', async () => {
      mockFetch.mockResolvedValueOnce(makeJsonFetchResponse([makeIgdbGame()]));

      await service.findById(1);

      expect(mockFetch).toHaveBeenCalledWith('https://api.igdb.com/v4/games', expect.any(Object));
    });
  });
});
