/**
 * MateAI Core Module
 *
 * Main entry point for core functionality
 */

// Configuration
export * from './config';

// Database
export * from './database';

// Queue
export * from './queue';

// Common utilities
export * from './common';

// LLM
export * from './llm';
export type { Tool as LLMTool } from './llm/types';

// Adapters (re-export with specific types to avoid conflicts)
export { BaseAdapter, SlackAdapter } from './adapters';
export type {
  DataAdapter,
  AdapterStatus,
  AdapterConfig,
  RawEvent as AdapterRawEvent,
} from './adapters';

// Processors
export * from './processors';

// Memory
export * from './memory';

// Agents (selective exports to avoid conflicts)
export {
  ContextBuilder,
  ToolRegistry,
  OrchestratorAgent,
  createDefaultOrchestrator,
  SummarizationAgent,
  AnalysisAgent,
  QuestionAnsweringAgent,
  CodeAssistantAgent,
  SubAgentManager,
  createDefaultSubAgentManager,
  createDefaultToolRegistry,
  createMemoryMCPServer,
  ClaudeSDKAgent,
  createClaudeSDKAgent,
} from './agents';
export type {
  AgentContext,
  ConversationMessage,
  ContextOptions,
  Tool as AgentTool,
  ToolParameter,
  ToolHandler,
  ToolResult,
  ToolContext,
  AgentConfig,
  AgentRequest,
  AgentResponse,
  AgentToolCall,
  SubAgent,
  SubAgentInput,
  SubAgentOutput,
  ClaudeSDKAgentConfig,
  ClaudeSDKAgentRequest,
  ClaudeSDKAgentResponse,
  AgentStep,
} from './agents';
