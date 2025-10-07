/**
 * Claude SDK Agent
 *
 * Simple wrapper around Claude Agent SDK with memory integration
 */

import { query, type AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import type { MemoryRetrievalService } from '../memory/retrieval-service';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('agent:claude-sdk');

/**
 * Agent Configuration
 */
export interface ClaudeSDKAgentConfig {
  name: string;
  description: string;
  systemPrompt?: string;
  model?: 'sonnet' | 'opus' | 'haiku';
}

/**
 * Agent Request
 */
export interface ClaudeSDKAgentRequest {
  prompt: string;
  userId?: string;
  teamId?: string;
  includeMemoryContext?: boolean;
}

/**
 * Agent Response
 */
export interface ClaudeSDKAgentResponse {
  content: string;
  steps: AgentStep[];
  metadata: {
    duration: number;
    success: boolean;
  };
}

/**
 * Agent Step (for logging)
 */
export interface AgentStep {
  type: 'tool_use' | 'agent_use' | 'message' | 'thinking';
  timestamp: Date;
  details: any;
}

/**
 * Claude SDK Agent
 */
export class ClaudeSDKAgent {
  private config: Required<ClaudeSDKAgentConfig>;
  private memoryService: MemoryRetrievalService;

  constructor(
    memoryService: MemoryRetrievalService,
    config: ClaudeSDKAgentConfig
  ) {
    this.memoryService = memoryService;

    // Set config first (without systemPrompt)
    this.config = {
      name: config.name,
      description: config.description,
      systemPrompt: '', // Will be set below
      model: config.model || 'sonnet',
    };

    // Now set systemPrompt (can access this.config.name)
    this.config.systemPrompt = config.systemPrompt || this.buildDefaultSystemPrompt();

    logger.info({ config: this.config }, 'Claude SDK Agent initialized');
  }

  /**
   * Process a request
   */
  async process(request: ClaudeSDKAgentRequest): Promise<ClaudeSDKAgentResponse> {
    const startTime = Date.now();
    const steps: AgentStep[] = [];

    logger.info({ prompt: request.prompt }, 'Processing request');

    try {
      // Build system prompt with memory context
      let systemPrompt = this.config.systemPrompt;

      if (request.includeMemoryContext !== false) {
        const memoryContext = await this.buildMemoryContext(request.prompt);
        systemPrompt = `${systemPrompt}\n\n## Initial Memory Context\n\n${memoryContext}`;

        steps.push({
          type: 'thinking',
          timestamp: new Date(),
          details: { action: 'loaded_memory_context', chunks: memoryContext.split('\n\n').length },
        });
      }

      // Define sub-agents
      const agents = this.buildSubAgents();

      // Call Claude SDK
      logger.info('Calling Claude Agent SDK');

      const result = query({
        prompt: request.prompt,
        options: {
          model: this.config.model,
          systemPrompt,
          agents,
        },
      });

      // Collect messages
      logger.info('Collecting agent response');
      const messages: any[] = [];

      for await (const message of result) {
        messages.push(message);
        logger.debug({ messageType: message.type, message }, 'Received message');
      }

      // Extract text from messages
      let content = '';
      for (const msg of messages) {
        // Handle result message (final response from Claude Agent SDK)
        if (msg.type === 'result' && msg.subtype === 'success' && msg.result) {
          content = msg.result;
          break; // Result message contains the final answer
        }

        // Handle assistant message (streaming messages)
        if (msg.type === 'assistant' && msg.message?.content) {
          if (Array.isArray(msg.message.content)) {
            const textParts = msg.message.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text);
            const text = textParts.join('\n');
            if (text) content += text + '\n';
          }
        }
      }

      const duration = Date.now() - startTime;

      logger.info(
        {
          duration,
          steps: steps.length,
          contentLength: content.length,
        },
        'Request processed successfully'
      );

      return {
        content,
        steps,
        metadata: {
          duration,
          success: true,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Failed to process request');

      return {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        steps,
        metadata: {
          duration: Date.now() - startTime,
          success: false,
        },
      };
    }
  }

  /**
   * Build memory context from search
   */
  private async buildMemoryContext(prompt: string): Promise<string> {
    try {
      logger.debug('Building initial memory context');

      const result = await this.memoryService.search(prompt, {
        topK: 5,
        minSimilarity: 0.65,
      });

      if (result.chunks.length === 0) {
        return 'No relevant historical context found.';
      }

      const contextParts = result.chunks.map((chunk, index) => {
        return `[Context ${index + 1}] (${chunk.sourceType}, ${(chunk.similarity * 100).toFixed(1)}% relevant)
${chunk.content}`;
      });

      return `Here is some relevant context from the knowledge base:

${contextParts.join('\n\n')}`;
    } catch (error) {
      logger.warn({ error }, 'Failed to build memory context');
      return 'Memory context unavailable.';
    }
  }

  /**
   * Build sub-agents
   */
  private buildSubAgents(): Record<string, AgentDefinition> {
    return {
      summarizer: {
        description: 'Specializes in creating concise, clear summaries of text',
        prompt: 'You are an expert at summarization. Create clear, concise summaries that capture the key points.',
        model: 'sonnet',
      },
      analyzer: {
        description: 'Analyzes information to extract insights, patterns, sentiment, and key entities',
        prompt: 'You are an expert analyst. Extract meaningful insights, identify patterns, analyze sentiment, and highlight key entities.',
        model: 'sonnet',
      },
      researcher: {
        description: 'Deep dives into topics to gather comprehensive information',
        prompt: 'You are a thorough researcher. Gather comprehensive information, explore different angles, and provide detailed findings.',
        model: 'sonnet',
      },
    };
  }

  /**
   * Build default system prompt
   */
  private buildDefaultSystemPrompt(): string {
    return `You are ${this.config.name}, ${this.config.description}

## Your Capabilities

You have access to:
1. **Context Memory**: You receive relevant context from the team's knowledge base in your system prompt
2. **Sub-Agents**: You can delegate specialized tasks to:
   - summarizer: For creating summaries
   - analyzer: For deep analysis
   - researcher: For comprehensive research

## Your Approach

1. **Understand the Query**: Carefully analyze what the user is asking
2. **Use Provided Context**: Review the memory context provided in your system prompt
3. **Think Step by Step**: Break complex tasks into steps
4. **Delegate When Helpful**: Use sub-agents for specialized tasks
5. **Be Thorough**: Provide comprehensive, accurate answers

## Important Guidelines

- Base your answers on the provided context when available
- If context doesn't contain the information needed, say so clearly
- Be transparent about what you know and don't know
- Provide clear, helpful responses
- Cite sources from the context when referencing information`;
  }

  /**
   * Get agent stats
   */
  getStats() {
    return {
      name: this.config.name,
      description: this.config.description,
      model: this.config.model,
      memoryEnabled: true,
      subAgentsAvailable: 3, // summarizer, analyzer, researcher
    };
  }
}

/**
 * Create default Claude SDK agent
 */
export function createClaudeSDKAgent(
  memoryService: MemoryRetrievalService
): ClaudeSDKAgent {
  return new ClaudeSDKAgent(memoryService, {
    name: 'MateAI',
    description: 'an intelligent AI assistant with access to your team\'s collective knowledge',
    model: 'sonnet',
  });
}
