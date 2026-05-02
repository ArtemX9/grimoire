import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AI_RESPONSE_TYPE, RecommendationContext, ToolName } from '@grimoire/shared';

import { BaseLLMProvider, LLMRequest, ParsedLine } from './base-llm.provider';
import { buildPrompt } from './common/prompt';
import { getAnthropicTools } from './common/tools';

type ClaudeState = {
  currentBlockType: 'text' | 'tool_use' | null;
  currentToolName: string;
  currentToolJSON: string;
};

@Injectable()
export class ClaudeProvider extends BaseLLMProvider {
  protected readonly lineMode = 'sse' as const;

  constructor(private config: ConfigService) {
    super();
  }

  protected buildRequest(context: RecommendationContext): LLMRequest {
    const temperature = this.config.get<number>('app.llm.temperature', 0.7);

    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': this.config.get('app.llm.anthropicApiKey')!,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        stream: true,
        temperature,
        tools: getAnthropicTools(),
        messages: [{ role: 'user', content: buildPrompt(context) }],
      },
    };
  }

  protected parseLine(line: string, state: Record<string, unknown>): ParsedLine {
    const claudeState = state as ClaudeState;
    if (claudeState.currentBlockType === undefined) {
      claudeState.currentBlockType = null;
      claudeState.currentToolName = '';
      claudeState.currentToolJSON = '';
    }

    try {
      const parsed = JSON.parse(line.replace('data: ', ''));

      if (parsed.type === 'content_block_start') {
        claudeState.currentBlockType = parsed.content_block.type;
        if (claudeState.currentBlockType === 'tool_use') {
          claudeState.currentToolName = parsed.content_block.name;
          claudeState.currentToolJSON = '';
        }
        return null;
      }

      if (parsed.type === 'content_block_delta') {
        if (parsed.delta.type === 'text_delta' && parsed.delta.text) {
          return { type: AI_RESPONSE_TYPE.TEXT, value: parsed.delta.text };
        }
        if (parsed.delta.type === 'input_json_delta') {
          claudeState.currentToolJSON += parsed.delta.partial_json;
        }
        return null;
      }

      if (parsed.type === 'content_block_stop' && claudeState.currentBlockType === 'tool_use') {
        const toolName = claudeState.currentToolName;
        const toolJSON = claudeState.currentToolJSON;
        claudeState.currentBlockType = null;

        if (toolName === ToolName.HIGHLIGHT_GAME) {
          try {
            return { type: AI_RESPONSE_TYPE.TOOL_CALL, name: ToolName.HIGHLIGHT_GAME, args: JSON.parse(toolJSON) };
          } catch (e) {
            return { type: AI_RESPONSE_TYPE.ERROR, message: `${e}` };
          }
        }
        return null;
      }

      if (parsed.type === 'message_stop') return { type: 'done' };
    } catch {}

    return null;
  }
}
