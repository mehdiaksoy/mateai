/**
 * Orchestrator Agent (Refactored with Claude Native Function Calling)
 *
 * Main agent that orchestrates responses using context and tools
 */

import type { LLMClient } from '../llm';
import type { ChatMessage, Tool as LLMTool } from '../llm/types';
import type { MemoryRetrievalService } from '../memory/retrieval-service';
import type { ContextBuilder, AgentContext, ConversationMessage } from './context-builder';
import type { ToolRegistry, ToolContext, ToolResult } from './tool-registry';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('agent:orchestrator');

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt?: string;
  maxIterations?: number;
  enableTools?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Agent request
 */
export interface AgentRequest {
  query: string;
  userId?: string;
  teamId?: string;
  conversationHistory?: ConversationMessage[];
  context?: Record<string, any>;
}

/**
 * Agent response
 */
export interface AgentResponse {
  content: string;
  toolCalls?: AgentToolCall[];
  context?: AgentContext;
  metadata: {
    tokensUsed: number;
    duration: number;
    iterations: number;
    toolsUsed: string[];
  };
}

/**
 * Agent tool call (different from LLM tool call)
 */
export interface AgentToolCall {
  tool: string;
  params: Record<string, any>;
  result?: ToolResult;
}

/**
 * Orchestrator Agent
 */
export class OrchestratorAgent {
  private config: Required<AgentConfig>;

  constructor(
    private llmClient: LLMClient,
    _retrievalService: MemoryRetrievalService,
    private contextBuilder: ContextBuilder,
    private toolRegistry: ToolRegistry,
    config: AgentConfig
  ) {
    this.config = {
      name: config.name,
      description: config.description,
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
      maxIterations: config.maxIterations || 5,
      enableTools: config.enableTools ?? true,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000,
    };

    logger.info({ config: this.config }, 'Orchestrator agent initialized');
  }

  /**
   * Process a user request
   */
  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    logger.info({ query: request.query }, 'Processing request');

    try {
      // Build context
      const context = await this.contextBuilder.buildContext(
        request.query,
        {
          systemPrompt: this.config.systemPrompt,
          includeHistory: true,
          maxHistory: 10,
        },
        request.conversationHistory || []
      );

      // Execute agent loop with Claude function calling
      const { content, toolCalls, tokensUsed, iterations } = await this.executeAgentLoop(
        request,
        context
      );

      const duration = Date.now() - startTime;
      const toolsUsed = Array.from(new Set(toolCalls.map((t) => t.tool)));

      logger.info(
        {
          duration,
          tokensUsed,
          iterations,
          toolsUsed,
        },
        'Request processed'
      );

      return {
        content,
        toolCalls,
        context,
        metadata: {
          tokensUsed,
          duration,
          iterations,
          toolsUsed,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Failed to process request');
      throw error;
    }
  }

  /**
   * Execute agent loop with Claude native function calling
   */
  private async executeAgentLoop(
    request: AgentRequest,
    context: AgentContext
  ): Promise<{
    content: string;
    toolCalls: AgentToolCall[];
    tokensUsed: number;
    iterations: number;
  }> {
    let iterations = 0;
    let totalTokens = 0;
    const toolCalls: AgentToolCall[] = [];

    // Build conversation messages
    const messages: ChatMessage[] = [];

    // Add system message
    messages.push({
      role: 'system',
      content: this.buildSystemMessage(context),
    });

    // Add conversation history
    context.conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current query
    messages.push({
      role: 'user',
      content: request.query,
    });

    // Get tools if enabled
    const tools: LLMTool[] | undefined = this.config.enableTools
      ? this.toolRegistry.formatForClaude()
      : undefined;

    // Agent loop
    while (iterations < this.config.maxIterations) {
      iterations++;
      logger.debug({ iteration: iterations }, 'Agent iteration');

      // Call LLM with tools
      const response = await this.llmClient.chat(messages, {
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        tools,
      });

      totalTokens += response.tokensUsed;

      // Check if there are tool calls
      if (!response.toolCalls || response.toolCalls.length === 0) {
        // No tool calls, this is the final response
        logger.info('Final response received');
        return {
          content: response.content,
          toolCalls,
          tokensUsed: totalTokens,
          iterations,
        };
      }

      // Execute tool calls
      logger.info(
        { toolCallsCount: response.toolCalls.length },
        'Executing tool calls'
      );

      // Add assistant message with tool calls to conversation
      messages.push({
        role: 'assistant',
        content: response.toolCalls.map((tc) => ({
          type: 'tool_use' as const,
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
      });

      const toolContext: ToolContext = {
        userId: request.userId,
        teamId: request.teamId,
        metadata: request.context,
      };

      // Execute each tool call
      for (const toolCall of response.toolCalls) {
        const result = await this.toolRegistry.execute(
          toolCall.name,
          toolCall.input,
          toolContext
        );

        toolCalls.push({
          tool: toolCall.name,
          params: toolCall.input,
          result,
        });

        // Add tool result to conversation
        messages.push({
          role: 'tool',
          content: JSON.stringify(result.data),
          tool_call_id: toolCall.id,
        });
      }

      // Continue loop to get next response
    }

    // Max iterations reached
    logger.warn('Max iterations reached');
    return {
      content: 'Unable to complete request within iteration limit.',
      toolCalls,
      tokensUsed: totalTokens,
      iterations,
    };
  }

  /**
   * Build system message with context
   */
  private buildSystemMessage(context: AgentContext): string {
    const parts: string[] = [];

    parts.push(context.systemPrompt);

    if (context.knowledgeContext) {
      parts.push('\n## Relevant Context from Knowledge Base\n');
      parts.push(context.knowledgeContext);
    }

    parts.push('\n## Important Instructions\n');
    parts.push('- Use the provided tools when you need to retrieve information');
    parts.push('- Base your answers on the provided context when available');
    parts.push('- Be concise and accurate');
    parts.push('- If you need more information, use the appropriate tool');

    return parts.join('\n');
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are ${this.config.name}, an intelligent AI assistant.

${this.config.description}

Your role is to:
- Understand user queries and provide helpful responses
- Use available tools to retrieve relevant information
- Provide accurate, well-reasoned answers based on context
- Acknowledge limitations and ask for clarification when needed

Always be helpful, accurate, and professional.`;
  }

  /**
   * Get agent statistics
   */
  getStats(): {
    name: string;
    description: string;
    toolsAvailable: number;
    config: Partial<AgentConfig>;
  } {
    return {
      name: this.config.name,
      description: this.config.description,
      toolsAvailable: this.toolRegistry.getAllTools().length,
      config: {
        maxIterations: this.config.maxIterations,
        enableTools: this.config.enableTools,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      },
    };
  }
}

/**
 * Create default orchestrator agent
 */
export function createDefaultOrchestrator(
  llmClient: LLMClient,
  retrievalService: MemoryRetrievalService,
  contextBuilder: ContextBuilder,
  toolRegistry: ToolRegistry
): OrchestratorAgent {
  return new OrchestratorAgent(
    llmClient,
    retrievalService,
    contextBuilder,
    toolRegistry,
    {
      name: 'MateAI',
      description: 'An intelligent assistant with access to your team\'s collective knowledge',
      maxIterations: 5,
      enableTools: true,
      temperature: 0.7,
      maxTokens: 2000,
    }
  );
}
