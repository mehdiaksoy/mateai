/**
 * Tool Registry
 *
 * Manages tools available to agents
 */

import { createComponentLogger } from '../common/logger';
import { z } from 'zod';

const logger = createComponentLogger('agent:tool-registry');

/**
 * Tool parameter schema
 */
export interface ToolParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  schema?: z.ZodType<any>;
}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler: ToolHandler;
  examples?: string[];
  category?: string;
}

/**
 * Tool execution context
 */
export interface ToolContext {
  userId?: string;
  teamId?: string;
  metadata?: Record<string, any>;
}

/**
 * Tool handler function
 */
export type ToolHandler = (
  params: Record<string, any>,
  context: ToolContext
) => Promise<ToolResult>;

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Tool Registry
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn({ toolName: tool.name }, 'Tool already registered, overwriting');
    }

    this.tools.set(tool.name, tool);
    logger.info(
      { toolName: tool.name, category: tool.category },
      'Tool registered'
    );
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): boolean {
    const result = this.tools.delete(toolName);
    if (result) {
      logger.info({ toolName }, 'Tool unregistered');
    }
    return result;
  }

  /**
   * Get a tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Tool[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.category === category
    );
  }

  /**
   * Execute a tool
   */
  async execute(
    toolName: string,
    params: Record<string, any>,
    context: ToolContext = {}
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      logger.error({ toolName }, 'Tool not found');
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
      };
    }

    logger.info({ toolName, params }, 'Executing tool');

    try {
      // Validate parameters
      const validation = this.validateParameters(tool, params);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid parameters: ${validation.error}`,
        };
      }

      // Execute tool
      const startTime = Date.now();
      const result = await tool.handler(params, context);
      const duration = Date.now() - startTime;

      logger.info(
        { toolName, success: result.success, duration },
        'Tool execution completed'
      );

      return result;
    } catch (error) {
      logger.error({ error, toolName }, 'Tool execution failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate tool parameters
   */
  private validateParameters(
    tool: Tool,
    params: Record<string, any>
  ): { valid: boolean; error?: string } {
    // Check required parameters
    for (const param of tool.parameters) {
      if (param.required && !(param.name in params)) {
        return {
          valid: false,
          error: `Missing required parameter: ${param.name}`,
        };
      }

      // Validate with schema if provided
      if (param.schema && param.name in params) {
        const result = param.schema.safeParse(params[param.name]);
        if (!result.success) {
          return {
            valid: false,
            error: `Invalid parameter ${param.name}: ${result.error.message}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Format tools for LLM
   */
  formatForLLM(): string {
    const tools = this.getAllTools();

    if (tools.length === 0) {
      return 'No tools available.';
    }

    const sections: string[] = ['# Available Tools'];

    // Group by category
    const categories = new Map<string, Tool[]>();
    tools.forEach((tool) => {
      const category = tool.category || 'General';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(tool);
    });

    // Format each category
    categories.forEach((categoryTools, category) => {
      sections.push(`\n## ${category}`);

      categoryTools.forEach((tool) => {
        sections.push(`\n### ${tool.name}`);
        sections.push(tool.description);

        if (tool.parameters.length > 0) {
          sections.push('\n**Parameters:**');
          tool.parameters.forEach((param) => {
            const required = param.required ? '(required)' : '(optional)';
            sections.push(
              `- ${param.name} (${param.type}) ${required}: ${param.description}`
            );
          });
        }

        if (tool.examples && tool.examples.length > 0) {
          sections.push('\n**Examples:**');
          tool.examples.forEach((example) => {
            sections.push(`- ${example}`);
          });
        }
      });
    });

    return sections.join('\n');
  }

  /**
   * Format tools as JSON schema (for function calling)
   */
  formatAsJsonSchema(): any[] {
    return this.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          tool.parameters.map((param) => [
            param.name,
            {
              type: param.type,
              description: param.description,
            },
          ])
        ),
        required: tool.parameters
          .filter((p) => p.required)
          .map((p) => p.name),
      },
    }));
  }

  /**
   * Format tools for Claude function calling
   */
  formatForClaude(): Array<{
    name: string;
    description: string;
    input_schema: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  }> {
    return this.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties: Object.fromEntries(
          tool.parameters.map((param) => [
            param.name,
            {
              type: param.type,
              description: param.description,
            },
          ])
        ),
        required: tool.parameters
          .filter((p) => p.required)
          .map((p) => p.name),
      },
    }));
  }

  /**
   * Get tool statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
  } {
    const tools = this.getAllTools();
    const byCategory: Record<string, number> = {};

    tools.forEach((tool) => {
      const category = tool.category || 'General';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    return {
      total: tools.length,
      byCategory,
    };
  }
}

/**
 * Create default tool registry with built-in tools
 */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // Memory Search Tool
  registry.register({
    name: 'search_memory',
    description: 'Search the knowledge base for relevant information',
    category: 'Memory',
    parameters: [
      {
        name: 'query',
        description: 'The search query',
        type: 'string',
        required: true,
      },
      {
        name: 'limit',
        description: 'Maximum number of results',
        type: 'number',
        required: false,
      },
    ],
    examples: [
      'search_memory(query="API authentication flow")',
      'search_memory(query="recent bugs", limit=5)',
    ],
    handler: async () => {
      // This will be implemented by the agent
      return {
        success: false,
        error: 'Not implemented - should be overridden by agent',
      };
    },
  });

  // Get Recent Events Tool
  registry.register({
    name: 'get_recent_events',
    description: 'Get recent events from a specific source',
    category: 'Memory',
    parameters: [
      {
        name: 'source',
        description: 'The source type (e.g., slack, jira)',
        type: 'string',
        required: true,
      },
      {
        name: 'limit',
        description: 'Maximum number of events',
        type: 'number',
        required: false,
      },
    ],
    examples: [
      'get_recent_events(source="slack", limit=10)',
      'get_recent_events(source="jira")',
    ],
    handler: async () => {
      return {
        success: false,
        error: 'Not implemented - should be overridden by agent',
      };
    },
  });

  // Find Similar Tool
  registry.register({
    name: 'find_similar',
    description: 'Find similar knowledge chunks to a given text',
    category: 'Memory',
    parameters: [
      {
        name: 'text',
        description: 'The text to find similar items for',
        type: 'string',
        required: true,
      },
      {
        name: 'limit',
        description: 'Maximum number of results',
        type: 'number',
        required: false,
      },
    ],
    examples: [
      'find_similar(text="Database migration issues")',
      'find_similar(text="User authentication", limit=5)',
    ],
    handler: async () => {
      return {
        success: false,
        error: 'Not implemented - should be overridden by agent',
      };
    },
  });

  return registry;
}
