import { RecommendationContext, ToolName } from '@grimoire/shared';

import { ToolDefinition, ToolFunctionParameters } from './types';

type AnthropicToolDefinition = {
  name: ToolName;
  description: string;
  input_schema: ToolFunctionParameters;
};

const GET_TOOLS_LIST = () => [
  {
    name: ToolName.HIGHLIGHT_GAME,
    description: "Scroll to a specific game in the list of games and highlight corresponding game to draw user's attention.",
    properties: {
      gameID: {
        type: 'string',
        description: 'Unique gameID that should be highlighted for the user in the list of games.',
      },
    },
    required: ['gameID'],
  },
];

export const getTools = () =>
  GET_TOOLS_LIST().map(
    (tool) =>
      ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: tool.properties,
            required: tool.required,
          } as ToolFunctionParameters,
        },
      }) as ToolDefinition,
  );

export const getAnthropicTools = (): AnthropicToolDefinition[] =>
  GET_TOOLS_LIST().map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.properties,
      required: tool.required,
    } as ToolFunctionParameters,
  }));

export function getEnrichedToolsWithUsersContext(ctx: RecommendationContext) {
  const tools = getTools();

  // for (const tool of tools) {
  //   const { name } = tool.function;
  //
  //   switch (name) {
  //     case ToolName.HIGHLIGHT_GAME:
  //       const gamesIDs = ctx.games.map((game) => game.gameID);
  //
  //       tool.function.description += ` Available games ids: [${gamesIDs.join(', ')}]`;
  //       tool.function.parameters.properties.gameID.enum = gamesIDs;
  //   }
  // }

  return tools;
}
