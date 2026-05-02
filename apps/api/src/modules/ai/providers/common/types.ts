import { ToolName } from '@grimoire/shared';

export type ToolFunctionParameters = {
  type: 'object';
  properties: Record<
    string,
    {
      type: string;
      description: string;
      enum?: string[];
    }
  >;
  required?: string[];
};

export type ToolDefinition = {
  type: 'function';
  function: {
    name: ToolName;
    description: string;
    parameters: ToolFunctionParameters;
  };
};
