import { App, LogLevel } from '@slack/bolt';
import { BaseAdapter } from './base-adapter';
import type { RawEvent, AdapterConfig } from './types';
import { AdapterStatus } from './types';

/**
 * Slack Adapter Configuration
 */
export interface SlackAdapterConfig extends AdapterConfig {
  botToken: string;
  appToken: string;
  signingSecret: string;
}

/**
 * Slack Adapter
 *
 * Connects to Slack and receives events
 */
export class SlackAdapter extends BaseAdapter {
  private app: App | null = null;
  private config: SlackAdapterConfig;

  constructor(config: SlackAdapterConfig) {
    super('slack');
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.setStatus(AdapterStatus.CONNECTING);
      this.logger.info('Connecting to Slack...');

      // Initialize Slack App
      this.app = new App({
        token: this.config.botToken,
        appToken: this.config.appToken,
        signingSecret: this.config.signingSecret,
        socketMode: true, // Use Socket Mode for easier development
        logLevel: LogLevel.INFO,
      });

      // Register event handlers
      this.registerHandlers();

      this.setStatus(AdapterStatus.CONNECTED);
      this.logger.info('Connected to Slack');
    } catch (error) {
      this.setStatus(AdapterStatus.ERROR);
      this.emitError(error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting from Slack...');

    if (this.app) {
      await this.app.stop();
      this.app = null;
    }

    this.setStatus(AdapterStatus.DISCONNECTED);
    this.logger.info('Disconnected from Slack');
  }

  async start(): Promise<void> {
    if (!this.app) {
      throw new Error('Adapter not connected. Call connect() first.');
    }

    this.logger.info('Starting Slack adapter...');
    await this.app.start();
    this.logger.info('Slack adapter started');
  }

  async stop(): Promise<void> {
    if (this.app) {
      await this.app.stop();
    }
    this.logger.info('Slack adapter stopped');
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.app) return false;

      // Try to call auth.test API
      const result = await this.app.client.auth.test();
      return !!result.ok;
    } catch (error) {
      this.logger.error({ error }, 'Health check failed');
      return false;
    }
  }

  /**
   * Register Slack event handlers
   */
  private registerHandlers(): void {
    if (!this.app) return;

    // Handle message events
    this.app.message(async ({ message }) => {
      try {
        // Filter out bot messages
        if ('bot_id' in message) {
          return;
        }

        // Only handle regular messages with text
        if (message.type === 'message' && 'text' in message) {
          const event: RawEvent = {
            source: 'slack',
            eventType: 'message',
            externalId: message.ts,
            payload: {
              text: message.text,
              user: message.user,
              channel: message.channel,
              ts: message.ts,
              thread_ts: 'thread_ts' in message ? message.thread_ts : undefined,
            },
            metadata: {
              channelType: message.channel_type,
            },
            timestamp: new Date(parseFloat(message.ts) * 1000),
          };

          this.emitEvent(event);
        }
      } catch (error) {
        this.logger.error({ error }, 'Error handling message');
        this.emitError(error as Error);
      }
    });

    // Handle reactions
    this.app.event('reaction_added', async ({ event }) => {
      try {
        const rawEvent: RawEvent = {
          source: 'slack',
          eventType: 'reaction_added',
          externalId: `${event.item.ts}-${event.reaction}`,
          payload: {
            reaction: event.reaction,
            user: event.user,
            item: event.item,
            item_user: event.item_user,
          },
          metadata: {
            eventTs: event.event_ts,
          },
          timestamp: new Date(parseFloat(event.event_ts) * 1000),
        };

        this.emitEvent(rawEvent);
      } catch (error) {
        this.logger.error({ error }, 'Error handling reaction');
        this.emitError(error as Error);
      }
    });

    // Handle errors
    this.app.error(async (error) => {
      this.logger.error({ error }, 'Slack app error');
      this.emitError(error as Error);
    });
  }
}
