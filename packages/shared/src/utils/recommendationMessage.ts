import {
  AI_RESPONSE_TYPE,
  RecommendationMessage,
  RecommendationResponseText,
  RecommendationResponseToolCall,
  RecommendationResponseError, RecommendationResponseThink
} from '../types';

type ArgsMap = {
  [AI_RESPONSE_TYPE.TOOL_CALL]: RecommendationResponseToolCall;
  [AI_RESPONSE_TYPE.TEXT]: RecommendationResponseText;
  [AI_RESPONSE_TYPE.ERROR]: RecommendationResponseError;
  [AI_RESPONSE_TYPE.THINK]: RecommendationResponseThink;
};

export function parseRecommendationMessage(raw: string): RecommendationMessage {
  return JSON.parse(raw) as RecommendationMessage;
}

export function createRecommendationMessage<T extends AI_RESPONSE_TYPE>(
  type: T,
  args: ArgsMap[T],
): { type: T } & ArgsMap[T] {
  return { type, ...args } as { type: T } & ArgsMap[T];
}
