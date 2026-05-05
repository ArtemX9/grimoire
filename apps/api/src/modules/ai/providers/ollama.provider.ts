import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AI_RESPONSE_TYPE, RecommendationContext, ToolName } from '@grimoire/shared';

import { BaseLLMProvider, LLMRequest, ParsedLine } from './base-llm.provider';
import { buildPrompt } from './common/prompt';
import { getEnrichedToolsWithUsersContext } from './common/tools';

@Injectable()
export class OllamaProvider extends BaseLLMProvider {
  protected readonly lineMode = 'ndjson' as const;

  constructor(private config: ConfigService) {
    super();
  }

  protected buildRequest(context: RecommendationContext): LLMRequest {
    const baseURL = this.config.get<string>('app.llm.ollamaBaseUrl', 'http://localhost:11434');
    const model = this.config.get<string>('app.llm.ollamaModel', 'llama3.2');
    const temperature = this.config.get<number>('app.llm.temperature', 0.7);
    const numCtx = this.config.get<number>('app.llm.numCtx', 32768);

    return {
      url: `${baseURL}/api/chat`,
      headers: {},
      body: {
        model,
        stream: true,
        think: true,
        tools: getEnrichedToolsWithUsersContext(context),
        options: { temperature, num_ctx: numCtx },
        messages: [{ role: 'user', content: buildPrompt(context) }],
      },
    };
  }

  protected parseLine(line: string, _state: Record<string, unknown>): ParsedLine {
    try {
      const parsed = JSON.parse(line);

      if (parsed.message?.tool_calls?.length > 0) {
        const toolCall = parsed.message.tool_calls[0];
        if (toolCall.function?.name === ToolName.HIGHLIGHT_GAME) {
          return { type: AI_RESPONSE_TYPE.TOOL_CALL, name: ToolName.HIGHLIGHT_GAME, args: toolCall.function.arguments };
        }
      }

      const token = parsed.message?.content;

      if (token) return { type: AI_RESPONSE_TYPE.TEXT, value: token };

      if (parsed.done) return { type: 'done' };
    } catch {}

    return null;
  }
}
