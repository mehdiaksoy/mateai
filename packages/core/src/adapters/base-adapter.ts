import { EventEmitter } from 'events';
import type { Logger } from 'pino';
import { createComponentLogger } from '../common/logger';
import type {
  DataAdapter,
  RawEvent,
  AdapterStatus,
  AdapterEvents,
} from './types';
import { AdapterStatus as Status } from './types';

/**
 * Base Adapter Implementation
 *
 * Provides common functionality for all adapters
 */
export abstract class BaseAdapter implements DataAdapter {
  protected logger: Logger;
  protected emitter: EventEmitter;
  protected _status: AdapterStatus = Status.DISCONNECTED;

  constructor(public readonly name: string) {
    this.logger = createComponentLogger(`adapter:${name}`);
    this.emitter = new EventEmitter();
    this.logger.info(`Adapter "${name}" initialized`);
  }

  get status(): AdapterStatus {
    return this._status;
  }

  protected setStatus(status: AdapterStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.logger.info({ status }, `Status changed to ${status}`);
      this.emitter.emit('statusChange', status);
    }
  }

  /**
   * Emit a raw event
   */
  protected emitEvent(event: RawEvent): void {
    this.logger.debug(
      { eventType: event.eventType, source: event.source },
      `Emitting event: ${event.eventType}`
    );
    this.emitter.emit('event', event);
  }

  /**
   * Emit an error
   */
  protected emitError(error: Error): void {
    this.logger.error({ error }, `Error: ${error.message}`);
    this.emitter.emit('error', error);
  }

  // Event subscription
  on<E extends keyof AdapterEvents>(
    event: E,
    listener: AdapterEvents[E]
  ): void {
    this.emitter.on(event, listener as any);
  }

  off<E extends keyof AdapterEvents>(
    event: E,
    listener: AdapterEvents[E]
  ): void {
    this.emitter.off(event, listener as any);
  }

  // Abstract methods to be implemented by subclasses
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
}
