/**
 * Queue Definitions
 *
 * Define all queue names and their data types
 */

// Queue names as constants
export const QUEUE_NAMES = {
  INGESTION: 'ingestion',
  PROCESSING: 'processing',
  EMBEDDING: 'embedding',
  AGENT_TASKS: 'agent-tasks',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Ingestion Queue Data
 * Raw events from data sources
 */
export interface IngestionJobData {
  source: string;
  eventType: string;
  externalId?: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Processing Queue Data
 * Events to be enriched and summarized
 */
export interface ProcessingJobData {
  rawEventId: string;
  source: string;
  eventType: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Embedding Queue Data
 * Content to be embedded
 */
export interface EmbeddingJobData {
  chunkId: string;
  content: string;
  model?: string;
}

/**
 * Agent Task Queue Data
 * Tasks for agent to execute
 */
export interface AgentTaskJobData {
  userId: string;
  query: string;
  channel: string;
  conversationId?: string;
  context?: Record<string, any>;
}
