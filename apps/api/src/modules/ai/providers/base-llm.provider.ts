import { Observable } from 'rxjs';

import { AI_RESPONSE_TYPE, RecommendationContext, ToolName, createRecommendationMessage } from '@grimoire/shared';

import { LLMProvider } from './llm-provider.interface';

export type ParsedLine =
  | { type: AI_RESPONSE_TYPE.TEXT; value: string }
  | { type: AI_RESPONSE_TYPE.TOOL_CALL; name: ToolName; args: unknown }
  | { type: AI_RESPONSE_TYPE.ERROR; message: string }
  | { type: 'done' }
  | null;

export type LLMRequest = {
  url: string;
  headers: Record<string, string>;
  body: unknown;
};

export abstract class BaseLLMProvider implements LLMProvider {
  protected abstract readonly lineMode: 'sse' | 'ndjson';

  protected abstract buildRequest(context: RecommendationContext): LLMRequest;

  /**
   * Parse a single line from the stream. `state` is a plain object created
   * once per recommend() call — use it for any per-stream accumulation
   * (e.g. stitching streamed tool-call argument fragments).
   */
  protected abstract parseLine(line: string, state: Record<string, unknown>): ParsedLine;

  recommend(context: RecommendationContext): Observable<string> {
    return new Observable((subscriber) => {
      const { url, headers, body } = this.buildRequest(context);
      const state: Record<string, unknown> = {};

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              subscriber.complete();
              break;
            }

            if (this.lineMode === 'ndjson') {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.trim()) continue;
                const result = this._dispatchLine(line, state);
                if (result === 'done') {
                  subscriber.complete();
                  return;
                }
                if (result !== null) {
                  subscriber.next(result);
                }
              }
            } else {
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

              for (const line of lines) {
                const result = this._dispatchLine(line, state);
                if (result === 'done') {
                  subscriber.complete();
                  return;
                }
                if (result !== null) {
                  subscriber.next(result);
                }
              }
            }
          }
        })
        .catch((err) => subscriber.error(err));
    });
  }

  private _dispatchLine(line: string, state: Record<string, unknown>): string | 'done' | null {
    const parsed = this.parseLine(line, state);
    if (parsed === null) return null;

    switch (parsed.type) {
      case 'done':
        return 'done';

      case AI_RESPONSE_TYPE.TEXT:
        return JSON.stringify(createRecommendationMessage(AI_RESPONSE_TYPE.TEXT, { text: parsed.value }));

      case AI_RESPONSE_TYPE.TOOL_CALL:
        return JSON.stringify(
          createRecommendationMessage(AI_RESPONSE_TYPE.TOOL_CALL, {
            name: parsed.name,
            arguments: parsed.args as Record<string, unknown>,
          }),
        );

      case AI_RESPONSE_TYPE.ERROR:
        return JSON.stringify(createRecommendationMessage(AI_RESPONSE_TYPE.ERROR, { error: parsed.message }));
    }
  }
}
