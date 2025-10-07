/**
 * Adapter Types
 *
 * Base types for data source adapters
 */

/**
 * Raw Event from data source
 */
export interface RawEvent {
  source: string; // 'slack', 'jira', 'git'
  eventType: string; // 'message', 'issue_update', 'commit'
  externalId?: string; // ID in source system
  payload: Record<string, any>; // Raw data
  metadata?: Record<string, any>; // Additional context
  timestamp?: Date;
}

/**
 * Adapter Status
 */
export enum AdapterStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Adapter Events
 */
export interface AdapterEvents {
  // Event received from source
  event: (event: RawEvent) => void;
  // Adapter status changed
  statusChange: (status: AdapterStatus) => void;
  // Error occurred
  error: (error: Error) => void;
}

/**
 * Data Source Adapter Interface
 */
export interface DataAdapter {
  /**
   * Unique name for this adapter
   */
  readonly name: string;

  /**
   * Current status
   */
  readonly status: AdapterStatus;

  /**
   * Connect to data source
   */
  connect(): Promise<void>;

  /**
   * Disconnect from data source
   */
  disconnect(): Promise<void>;

  /**
   * Start listening for events
   */
  start(): Promise<void>;

  /**
   * Stop listening for events
   */
  stop(): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;

  /**
   * Subscribe to adapter events
   */
  on<E extends keyof AdapterEvents>(
    event: E,
    listener: AdapterEvents[E]
  ): void;

  /**
   * Unsubscribe from adapter events
   */
  off<E extends keyof AdapterEvents>(
    event: E,
    listener: AdapterEvents[E]
  ): void;
}

/**
 * Adapter Configuration
 */
export interface AdapterConfig {
  enabled: boolean;
  [key: string]: any;
}
