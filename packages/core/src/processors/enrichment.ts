/**
 * Enrichment Processor
 *
 * Extracts metadata and calculates importance score
 */

import type { RawEvent } from '@prisma/client';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('processor:enrichment');

export interface EnrichedEvent {
  rawEvent: RawEvent;
  extractedText: string;
  entities: {
    users?: string[];
    mentions?: string[];
    links?: string[];
    keywords?: string[];
  };
  importance: number; // 0-1
  enrichedMetadata: Record<string, any>;
}

/**
 * Enrichment Processor
 */
export class EnrichmentProcessor {
  /**
   * Enrich a raw event with metadata and importance score
   */
  async enrich(rawEvent: RawEvent): Promise<EnrichedEvent> {
    logger.debug({ rawEventId: rawEvent.id }, 'Enriching event');

    // Extract text from payload
    const extractedText = this.extractText(rawEvent);

    // Extract entities
    const entities = this.extractEntities(rawEvent, extractedText);

    // Calculate importance score
    const importance = this.calculateImportance(rawEvent, entities);

    // Build enriched metadata
    const enrichedMetadata = {
      ...((rawEvent.metadata as Record<string, any>) || {}),
      wordCount: extractedText.split(/\s+/).length,
      hasLinks: entities.links && entities.links.length > 0,
      hasMentions: entities.mentions && entities.mentions.length > 0,
    };

    logger.info(
      { rawEventId: rawEvent.id, importance },
      'Event enriched'
    );

    return {
      rawEvent,
      extractedText,
      entities,
      importance,
      enrichedMetadata,
    };
  }

  /**
   * Extract text content from raw event
   */
  private extractText(rawEvent: RawEvent): string {
    const payload = rawEvent.payload as Record<string, any>;

    switch (rawEvent.source) {
      case 'slack':
        return payload.text || '';
      case 'jira':
        return [payload.title, payload.description].filter(Boolean).join('\n');
      case 'git':
        return [payload.message, payload.body].filter(Boolean).join('\n');
      default:
        return JSON.stringify(payload);
    }
  }

  /**
   * Extract entities from event
   */
  private extractEntities(
    rawEvent: RawEvent,
    text: string
  ): EnrichedEvent['entities'] {
    const payload = rawEvent.payload as Record<string, any>;

    const entities: EnrichedEvent['entities'] = {};

    // Extract users
    if (payload.user) {
      entities.users = [payload.user];
    }

    // Extract mentions (Slack style @user)
    const mentions = text.match(/<@[A-Z0-9]+>/g);
    if (mentions) {
      entities.mentions = mentions.map((m) => m.replace(/<@|>/g, ''));
    }

    // Extract links
    const links = text.match(/https?:\/\/[^\s]+/g);
    if (links) {
      entities.links = links;
    }

    // Extract simple keywords (words > 4 chars, appearing multiple times)
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    entities.keywords = Array.from(wordCount.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return entities;
  }

  /**
   * Calculate importance score (0-1)
   */
  private calculateImportance(
    rawEvent: RawEvent,
    entities: EnrichedEvent['entities']
  ): number {
    const payload = rawEvent.payload as Record<string, any>;
    let score = 0.5; // Base score

    // Slack-specific signals
    if (rawEvent.source === 'slack') {
      // Thread messages are slightly less important
      if (payload.thread_ts) {
        score -= 0.1;
      }

      // Messages with reactions are more important
      if (payload.reactions && payload.reactions.length > 0) {
        score += 0.2;
      }
    }

    // Jira-specific signals
    if (rawEvent.source === 'jira') {
      // Higher priority issues
      if (payload.priority === 'High' || payload.priority === 'Critical') {
        score += 0.3;
      }
    }

    // General signals
    // Links indicate external references (important)
    if (entities.links && entities.links.length > 0) {
      score += 0.1;
    }

    // Mentions indicate collaboration (important)
    if (entities.mentions && entities.mentions.length > 0) {
      score += 0.15;
    }

    // Longer text might be more substantial
    const text = this.extractText(rawEvent);
    if (text.length > 200) {
      score += 0.1;
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  }
}
