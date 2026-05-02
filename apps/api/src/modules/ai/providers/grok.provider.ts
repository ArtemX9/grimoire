import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AI_RESPONSE_TYPE, RecommendationContext, ToolName } from '@grimoire/shared';

import { BaseLLMProvider, LLMRequest, ParsedLine } from './base-llm.provider';
import { buildPrompt } from './common/prompt';
import { getEnrichedToolsWithUsersContext } from './common/tools';

type GrokState = {
  toolCalls: Record<number, { name: string; arguments: string }>;
};

@Injectable()
export class GrokProvider extends BaseLLMProvider {
  protected readonly lineMode = 'sse' as const;

  constructor(private config: ConfigService) {
    super();
  }

  protected buildRequest(context: RecommendationContext): LLMRequest {
    const temperature = this.config.get<number>('app.llm.temperature', 0.7);

    return {
      url: 'https://api.x.ai/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${this.config.get('app.llm.grokApiKey')}`,
      },
      body: {
        model: 'grok-3',
        stream: true,
        messages: [{ role: 'user', content: buildPrompt(context) }],
        tools: getEnrichedToolsWithUsersContext(context),
        temperature,
      },
    };
  }

  protected parseLine(line: string, state: Record<string, unknown>): ParsedLine {
    const data = line.replace('data: ', '');
    if (data === '[DONE]') return { type: 'done' };

    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta;
      const grokState = state as GrokState;

      if (!grokState.toolCalls) grokState.toolCalls = {};

      for (const tc of delta?.tool_calls ?? []) {
        if (!grokState.toolCalls[tc.index]) {
          grokState.toolCalls[tc.index] = { name: '', arguments: '' };
        }
        if (tc.function?.name) grokState.toolCalls[tc.index].name = tc.function.name;
        if (tc.function?.arguments) grokState.toolCalls[tc.index].arguments += tc.function.arguments;
      }

      if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
        for (const tc of Object.values(grokState.toolCalls)) {
          if (tc.name === ToolName.HIGHLIGHT_GAME) {
            try {
              return { type: AI_RESPONSE_TYPE.TOOL_CALL, name: ToolName.HIGHLIGHT_GAME, args: JSON.parse(tc.arguments) };
            } catch (e) {
              return { type: AI_RESPONSE_TYPE.ERROR, message: `${e}` };
            }
          }
        }
      }

      const token = delta?.content;
      if (token) return { type: AI_RESPONSE_TYPE.TEXT, value: token };
    } catch {}

    return null;
  }
}
