/**
 * Memory MCP Server
 *
 * MCP server providing memory/knowledge base tools for Claude Agent SDK
 */

import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { MemoryRetrievalService } from '../memory/retrieval-service';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('mcp:memory');

/**
 * Create Memory MCP Server
 */
export function createMemoryMCPServer(
  memoryService: MemoryRetrievalService
) {
  logger.info('Creating Memory MCP Server');

  // Search Memory Tool
  const searchMemoryTool = tool(
    'search_memory',
    'Search the team\'s knowledge base for relevant information. Use this when you need historical context, past discussions, or documented knowledge.',
    {
      query: z.string().describe('The search query'),
      limit: z.number().optional().describe('Maximum number of results (default: 10)'),
    },
    async ({ query, limit }) => {
      logger.info({ query, limit }, 'Searching memory');

      try {
        const result = await memoryService.search(query, {
          topK: limit || 10,
          minSimilarity: 0.6,
        });

        if (result.chunks.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'No relevant information found in knowledge base.',
              },
            ],
          };
        }

        // Format results
        const formattedResults = result.chunks.map((chunk, index) => {
          return `[${index + 1}] (${chunk.sourceType}, ${(chunk.similarity * 100).toFixed(1)}% relevant)
${chunk.content}

Metadata: Created ${chunk.createdAt.toLocaleDateString()}`;
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Found ${result.chunks.length} relevant items:\n\n${formattedResults.join('\n\n---\n\n')}`,
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'Search memory failed');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error searching memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get Recent Events Tool
  const getRecentEventsTool = tool(
    'get_recent_events',
    'Get recent events from a specific source (e.g., slack, jira). Use this to see what happened recently.',
    {
      source: z.string().describe('Source type (e.g., "slack", "jira")'),
      limit: z.number().optional().describe('Maximum number of events (default: 10)'),
    },
    async ({ source, limit }) => {
      logger.info({ source, limit }, 'Getting recent events');

      try {
        const chunks = await memoryService.getRecent(source, limit || 10);

        if (chunks.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No recent events found from ${source}.`,
              },
            ],
          };
        }

        // Format results
        const formattedEvents = chunks.map((chunk, index) => {
          return `[${index + 1}] ${chunk.content}
Created: ${chunk.createdAt.toLocaleString()}`;
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Recent events from ${source}:\n\n${formattedEvents.join('\n\n---\n\n')}`,
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'Get recent events failed');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error getting recent events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Find Similar Tool
  const findSimilarTool = tool(
    'find_similar',
    'Find knowledge chunks similar to a given chunk ID. Use this to explore related information.',
    {
      chunkId: z.string().describe('ID of the chunk to find similar items for'),
      limit: z.number().optional().describe('Maximum number of results (default: 5)'),
    },
    async ({ chunkId, limit }) => {
      logger.info({ chunkId, limit }, 'Finding similar chunks');

      try {
        const result = await memoryService.findSimilar(chunkId, {
          topK: limit || 5,
          minSimilarity: 0.7,
        });

        if (result.chunks.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'No similar items found.',
              },
            ],
          };
        }

        // Format results
        const formattedResults = result.chunks.map((chunk, index) => {
          return `[${index + 1}] (${(chunk.similarity * 100).toFixed(1)}% similar)
${chunk.content}`;
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Found ${result.chunks.length} similar items:\n\n${formattedResults.join('\n\n---\n\n')}`,
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'Find similar failed');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error finding similar items: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create MCP Server
  const server = createSdkMcpServer({
    name: 'memory-server',
    version: '1.0.0',
    tools: [searchMemoryTool, getRecentEventsTool, findSimilarTool],
  });

  logger.info('Memory MCP Server created with 3 tools');

  return server;
}
