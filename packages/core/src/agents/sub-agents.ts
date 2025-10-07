/**
 * Sub-Agents
 *
 * Specialized agents for specific tasks
 */

import type { LLMClient } from '../llm';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('agent:sub-agents');

/**
 * Sub-agent interface
 */
export interface SubAgent {
  name: string;
  description: string;
  capabilities: string[];
  process(input: SubAgentInput): Promise<SubAgentOutput>;
}

/**
 * Sub-agent input
 */
export interface SubAgentInput {
  task: string;
  context?: Record<string, any>;
  parameters?: Record<string, any>;
}

/**
 * Sub-agent output
 */
export interface SubAgentOutput {
  success: boolean;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Summarization Agent
 * Specialized in creating concise summaries
 */
export class SummarizationAgent implements SubAgent {
  name = 'SummarizationAgent';
  description = 'Creates concise summaries of long text';
  capabilities = ['summarize', 'extract_key_points', 'tldr'];

  constructor(private llmClient: LLMClient) {}

  async process(input: SubAgentInput): Promise<SubAgentOutput> {
    logger.debug({ task: input.task }, 'Summarization agent processing');

    try {
      const maxWords = input.parameters?.maxWords || 100;
      const style = input.parameters?.style || 'concise';

      const prompt = this.buildPrompt(input.task, maxWords, style);

      const response = await this.llmClient.complete(prompt, {
        maxTokens: 500,
        temperature: 0.3,
      });

      logger.info('Summarization completed');

      return {
        success: true,
        result: response.content,
        metadata: {
          tokensUsed: response.tokensUsed,
          originalLength: input.task.length,
          summaryLength: response.content.length,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Summarization failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildPrompt(text: string, maxWords: number, style: string): string {
    return `Summarize the following text in approximately ${maxWords} words using a ${style} style.

Text:
${text}

Summary:`;
  }
}

/**
 * Analysis Agent
 * Specialized in analyzing and extracting insights
 */
export class AnalysisAgent implements SubAgent {
  name = 'AnalysisAgent';
  description = 'Analyzes text and extracts insights, patterns, and sentiment';
  capabilities = ['sentiment_analysis', 'key_entities', 'topic_extraction', 'pattern_detection'];

  constructor(private llmClient: LLMClient) {}

  async process(input: SubAgentInput): Promise<SubAgentOutput> {
    logger.debug({ task: input.task }, 'Analysis agent processing');

    try {
      const analysisType = input.parameters?.type || 'general';
      const prompt = this.buildPrompt(input.task, analysisType);

      const response = await this.llmClient.complete(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      logger.info({ analysisType }, 'Analysis completed');

      return {
        success: true,
        result: this.parseAnalysisResult(response.content, analysisType),
        metadata: {
          tokensUsed: response.tokensUsed,
          analysisType,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Analysis failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildPrompt(text: string, analysisType: string): string {
    const prompts: Record<string, string> = {
      sentiment: `Analyze the sentiment of the following text. Provide:
1. Overall sentiment (positive/negative/neutral)
2. Confidence score (0-1)
3. Key emotional indicators

Text: ${text}`,

      entities: `Extract key entities from the following text:
1. People
2. Organizations
3. Locations
4. Technologies
5. Important concepts

Text: ${text}`,

      topics: `Identify the main topics discussed in the following text:
1. Primary topics
2. Secondary topics
3. Keywords

Text: ${text}`,

      general: `Analyze the following text and provide:
1. Main theme
2. Key points
3. Sentiment
4. Important entities
5. Actionable insights

Text: ${text}`,
    };

    return prompts[analysisType] || prompts.general;
  }

  private parseAnalysisResult(content: string, type: string): any {
    // Basic parsing - can be enhanced with structured output
    return {
      type,
      analysis: content,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Question Answering Agent
 * Specialized in answering specific questions based on context
 */
export class QuestionAnsweringAgent implements SubAgent {
  name = 'QuestionAnsweringAgent';
  description = 'Answers specific questions based on provided context';
  capabilities = ['answer_question', 'explain', 'clarify'];

  constructor(private llmClient: LLMClient) {}

  async process(input: SubAgentInput): Promise<SubAgentOutput> {
    logger.debug({ task: input.task }, 'QA agent processing');

    try {
      const context = input.context?.text || '';
      const prompt = this.buildPrompt(input.task, context);

      const response = await this.llmClient.complete(prompt, {
        maxTokens: 600,
        temperature: 0.4,
      });

      logger.info('Question answered');

      return {
        success: true,
        result: {
          question: input.task,
          answer: response.content,
          hasContext: !!context,
        },
        metadata: {
          tokensUsed: response.tokensUsed,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Question answering failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildPrompt(question: string, context: string): string {
    if (context) {
      return `Based on the following context, answer the question.

Context:
${context}

Question: ${question}

Answer:`;
    }

    return `Answer the following question to the best of your knowledge:

Question: ${question}

Answer:`;
  }
}

/**
 * Code Assistant Agent
 * Specialized in code-related tasks
 */
export class CodeAssistantAgent implements SubAgent {
  name = 'CodeAssistantAgent';
  description = 'Assists with code understanding, generation, and debugging';
  capabilities = ['explain_code', 'generate_code', 'debug', 'review'];

  constructor(private llmClient: LLMClient) {}

  async process(input: SubAgentInput): Promise<SubAgentOutput> {
    logger.debug({ task: input.task }, 'Code assistant processing');

    try {
      const taskType = input.parameters?.type || 'explain';
      const language = input.parameters?.language || 'auto-detect';
      const code = input.context?.code || '';

      const prompt = this.buildPrompt(input.task, taskType, language, code);

      const response = await this.llmClient.complete(prompt, {
        maxTokens: 1000,
        temperature: 0.5,
      });

      logger.info({ taskType, language }, 'Code task completed');

      return {
        success: true,
        result: {
          type: taskType,
          language,
          output: response.content,
        },
        metadata: {
          tokensUsed: response.tokensUsed,
          taskType,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Code assistance failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildPrompt(
    task: string,
    type: string,
    language: string,
    code: string
  ): string {
    const prompts: Record<string, string> = {
      explain: `Explain what the following code does:

${code}

Explanation:`,

      generate: `Generate ${language} code for the following task:

Task: ${task}

Code:`,

      debug: `Find and explain potential bugs in the following code:

${code}

Issues found:`,

      review: `Review the following code and provide suggestions for improvement:

${code}

Review:`,
    };

    return prompts[type] || `${task}\n\n${code}`;
  }
}

/**
 * Sub-Agent Manager
 * Manages and routes tasks to appropriate sub-agents
 */
export class SubAgentManager {
  private agents: Map<string, SubAgent> = new Map();

  /**
   * Register a sub-agent
   */
  register(agent: SubAgent): void {
    this.agents.set(agent.name, agent);
    logger.info({ agentName: agent.name }, 'Sub-agent registered');
  }

  /**
   * Get a sub-agent by name
   */
  getAgent(name: string): SubAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all sub-agents
   */
  getAllAgents(): SubAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Route a task to appropriate sub-agent
   */
  async route(input: SubAgentInput): Promise<SubAgentOutput> {
    // Simple routing based on task keywords
    const task = input.task.toLowerCase();

    let selectedAgent: SubAgent | undefined;

    if (task.includes('summarize') || task.includes('summary')) {
      selectedAgent = this.getAgent('SummarizationAgent');
    } else if (
      task.includes('analyze') ||
      task.includes('sentiment') ||
      task.includes('extract')
    ) {
      selectedAgent = this.getAgent('AnalysisAgent');
    } else if (task.includes('code') || task.includes('function')) {
      selectedAgent = this.getAgent('CodeAssistantAgent');
    } else if (task.includes('question') || task.includes('what') || task.includes('how')) {
      selectedAgent = this.getAgent('QuestionAnsweringAgent');
    }

    if (!selectedAgent) {
      logger.warn({ task }, 'No appropriate sub-agent found');
      return {
        success: false,
        error: 'No appropriate sub-agent found for this task',
      };
    }

    logger.info({ agentName: selectedAgent.name }, 'Routing to sub-agent');
    return selectedAgent.process(input);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalAgents: number;
    agents: Array<{
      name: string;
      description: string;
      capabilities: string[];
    }>;
  } {
    const agents = this.getAllAgents();

    return {
      totalAgents: agents.length,
      agents: agents.map((a) => ({
        name: a.name,
        description: a.description,
        capabilities: a.capabilities,
      })),
    };
  }
}

/**
 * Create default sub-agent manager with all agents
 */
export function createDefaultSubAgentManager(
  llmClient: LLMClient
): SubAgentManager {
  const manager = new SubAgentManager();

  manager.register(new SummarizationAgent(llmClient));
  manager.register(new AnalysisAgent(llmClient));
  manager.register(new QuestionAnsweringAgent(llmClient));
  manager.register(new CodeAssistantAgent(llmClient));

  return manager;
}
