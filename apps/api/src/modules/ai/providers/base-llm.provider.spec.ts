import { firstValueFrom, toArray } from 'rxjs';

import { AI_RESPONSE_TYPE, RecommendationContext, ToolName, createRecommendationMessage } from '@grimoire/shared';

import { BaseLLMProvider, LLMRequest, ParsedLine } from './base-llm.provider';

const MINIMAL_CONTEXT: RecommendationContext = {
  games: [],
  recentSessions: [],
  moods: [],
  sessionLengthMinutes: 30,
};

const FIXED_REQUEST: LLMRequest = {
  url: 'https://test.example/api',
  headers: { Authorization: 'Bearer test-key' },
  body: { model: 'test-model' },
};

function makeStream(chunks: Uint8Array[]): ReadableStream {
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(chunks[i++]);
      else controller.close();
    },
  });
}

const enc = new TextEncoder();

function makeFetchResponse(stream: ReadableStream): Response {
  return { ok: true, body: stream } as unknown as Response;
}

function collect(provider: BaseLLMProvider): Promise<string[]> {
  return firstValueFrom(provider.recommend(MINIMAL_CONTEXT).pipe(toArray()));
}

describe('BaseLLMProvider', () => {
  let parseLineMock: jest.Mock<ParsedLine, [string, Record<string, unknown>]>;

  beforeEach(() => {
    parseLineMock = jest.fn().mockReturnValue(null);
    global.fetch = jest.fn();
  });

  function makeProvider(lineMode: 'sse' | 'ndjson'): BaseLLMProvider {
    const mock = parseLineMock;
    return new (class extends BaseLLMProvider {
      protected readonly lineMode = lineMode;
      protected buildRequest(): LLMRequest {
        return FIXED_REQUEST;
      }
      protected parseLine(line: string, state: Record<string, unknown>): ParsedLine {
        return mock(line, state);
      }
    })();
  }

  describe('SSE mode', () => {
    it('emits serialised TEXT message for a token line', async () => {
      parseLineMock.mockReturnValue({ type: AI_RESPONSE_TYPE.TEXT, value: 'hello' });
      const stream = makeStream([enc.encode('data: {"choices":[{"delta":{"content":"hello"}}]}\n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('sse'));

      const expected = JSON.stringify(createRecommendationMessage(AI_RESPONSE_TYPE.TEXT, { text: 'hello' }));
      expect(results).toEqual([expected]);
    });

    it('emits serialised TOOL_CALL message for a toolCall line', async () => {
      const args = { gameID: 'game-1' };
      parseLineMock.mockReturnValue({ type: AI_RESPONSE_TYPE.TOOL_CALL, name: ToolName.HIGHLIGHT_GAME, args });
      const stream = makeStream([enc.encode('data: {"choices":[{"finish_reason":"tool_calls"}]}\n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('sse'));

      const expected = JSON.stringify(
        createRecommendationMessage(AI_RESPONSE_TYPE.TOOL_CALL, {
          name: ToolName.HIGHLIGHT_GAME,
          arguments: args as Record<string, unknown>,
        }),
      );
      expect(results).toEqual([expected]);
    });

    it('emits serialised ERROR message for an error line', async () => {
      parseLineMock.mockReturnValue({ type: AI_RESPONSE_TYPE.ERROR, message: 'something went wrong' });
      const stream = makeStream([enc.encode('data: {"error":"something went wrong"}\n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('sse'));

      const expected = JSON.stringify(
        createRecommendationMessage(AI_RESPONSE_TYPE.ERROR, { error: 'something went wrong' }),
      );
      expect(results).toEqual([expected]);
    });

    it('completes the observable when parseLine returns { type: "done" }', async () => {
      parseLineMock
        .mockReturnValueOnce({ type: AI_RESPONSE_TYPE.TEXT, value: 'word' })
        .mockReturnValueOnce({ type: 'done' });
      const stream = makeStream([enc.encode('data: first\ndata: [DONE]\n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('sse'));

      expect(results).toHaveLength(1);
      expect(parseLineMock).toHaveBeenCalledTimes(2);
    });

    it('skips lines that do not start with "data: "', async () => {
      const stream = makeStream([enc.encode('event: ping\nid: 42\n: keep-alive\n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('sse'));

      expect(parseLineMock).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });

    it('emits nothing when parseLine returns null', async () => {
      parseLineMock.mockReturnValue(null);
      const stream = makeStream([enc.encode('data: irrelevant\n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('sse'));

      expect(results).toHaveLength(0);
    });

    it('passes the [DONE] sentinel line through to parseLine', async () => {
      parseLineMock.mockReturnValue(null);
      const stream = makeStream([enc.encode('data: [DONE]\n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      await collect(makeProvider('sse'));

      expect(parseLineMock).toHaveBeenCalledWith('data: [DONE]', expect.any(Object));
    });
  });

  describe('NDJSON mode', () => {
    it('stitches a JSON object that spans two chunks and emits the token', async () => {
      const fullLine = '{"message":{"content":"hi"}}\n';
      const mid = Math.floor(fullLine.length / 2);
      const chunk1 = enc.encode(fullLine.slice(0, mid));
      const chunk2 = enc.encode(fullLine.slice(mid));

      parseLineMock
        .mockReturnValueOnce({ type: AI_RESPONSE_TYPE.TEXT, value: 'hi' })
        .mockReturnValue(null);

      const stream = makeStream([chunk1, chunk2]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('ndjson'));

      expect(parseLineMock).toHaveBeenCalledTimes(1);
      expect(parseLineMock).toHaveBeenCalledWith('{"message":{"content":"hi"}}', expect.any(Object));
      const expected = JSON.stringify(createRecommendationMessage(AI_RESPONSE_TYPE.TEXT, { text: 'hi' }));
      expect(results).toEqual([expected]);
    });

    it('emits token and completes correctly across multi-chunk delivery', async () => {
      parseLineMock
        .mockReturnValueOnce({ type: AI_RESPONSE_TYPE.TEXT, value: 'token1' })
        .mockReturnValueOnce({ type: AI_RESPONSE_TYPE.TEXT, value: 'token2' })
        .mockReturnValueOnce({ type: 'done' });

      const stream = makeStream([
        enc.encode('{"message":{"content":"token1"}}\n'),
        enc.encode('{"message":{"content":"token2"}}\n{"done":true}\n'),
      ]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      const results = await collect(makeProvider('ndjson'));

      expect(results).toHaveLength(2);
    });

    it('skips blank lines without calling parseLine', async () => {
      parseLineMock.mockReturnValue(null);
      const stream = makeStream([enc.encode('\n\n   \n')]);
      (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(stream));

      await collect(makeProvider('ndjson'));

      expect(parseLineMock).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('calls subscriber.error when fetch rejects', async () => {
      const fetchError = new Error('network failure');
      (global.fetch as jest.Mock).mockRejectedValue(fetchError);

      await expect(collect(makeProvider('sse'))).rejects.toThrow('network failure');
    });
  });
});