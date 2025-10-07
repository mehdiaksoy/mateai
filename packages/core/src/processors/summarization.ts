/**
 * Summarization Processor
 *
 * Generates concise summaries using LLM
 */

import type { LLMClient } from '../llm';
import { createComponentLogger } from '../common/logger';
import type { EnrichedEvent } from './enrichment';

const logger = createComponentLogger('processor:summarization');

export interface SummarizedEvent extends EnrichedEvent {
  summary: string;
  tokensUsed: number;
}

/**
 * Summarization Processor
 */
export class SummarizationProcessor {
  constructor(private llmClient: LLMClient) {}

  /**
   * Generate summary for an enriched event
   */
  async summarize(enrichedEvent: EnrichedEvent): Promise<SummarizedEvent> {
    const { rawEvent, extractedText } = enrichedEvent;

    logger.debug(
      { rawEventId: rawEvent.id },
      'Generating summary'
    );

    // Build context for summarization
    const context = this.buildContext(enrichedEvent);

    // Generate summary
    const prompt = this.buildPrompt(extractedText, context);

    try {
      const response = await this.llmClient.complete(prompt, {
        maxTokens: 200,
        temperature: 0.3, // Lower temperature for more focused summaries
      });

      logger.info(
        {
          rawEventId: rawEvent.id,
          tokensUsed: response.tokensUsed,
        },
        'Summary generated'
      );

      return {
        ...enrichedEvent,
        summary: response.content.trim(),
        tokensUsed: response.tokensUsed,
      };
    } catch (error) {
      logger.error(
        { error, rawEventId: rawEvent.id },
        'Failed to generate summary'
      );

      // Fallback: use truncated text
      return {
        ...enrichedEvent,
        summary: this.fallbackSummary(extractedText),
        tokensUsed: 0,
      };
    }
  }

  /**
   * Build context for summarization
   */
  private buildContext(enrichedEvent: EnrichedEvent): string {
    const { rawEvent, entities } = enrichedEvent;
    const parts: string[] = [];

    parts.push(`Source: ${rawEvent.source}`);
    parts.push(`Type: ${rawEvent.eventType}`);

    if (entities.users && entities.users.length > 0) {
      parts.push(`Users: ${entities.users.join(', ')}`);
    }

    if (entities.mentions && entities.mentions.length > 0) {
      parts.push(`Mentions: @${entities.mentions.length} users`);
    }

    if (entities.links && entities.links.length > 0) {
      parts.push(`Links: ${entities.links.length} external references`);
    }

    return parts.join(' | ');
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(text: string, context: string): string {
    return `You are a knowledge curator summarizing team communication.

Context: ${context}

Content:
${text}

Task: Create a concise, searchable summary (max 100 words) that:
- Captures the key information (who, what, why)
- Uses clear, professional language
- Preserves important technical terms
- Is optimized for semantic search

Summary:`;
  }

  /**
   * Fallback summary when LLM fails
   */
  private fallbackSummary(text: string): string {
    // Simple truncation with word boundary
    const maxLength = 200;
    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }
}
