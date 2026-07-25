/**
 * Agent Event Service
 *
 * Subscribes to agent response channels in Redis and processes the results.
 * When the Python agent service completes an event-driven task, it publishes
 * the response to a Redis channel. This service:
 *
 * 1. Subscribes to agent_response:* channels
 * 2. Stores responses in MongoDB (audit trail)
 * 3. Updates related entity status (invoice, lead, stock, etc.)
 * 4. Notifies the admin UI via SSE
 *
 * Flow: Agent -> Redis Response Channel -> This Service -> MongoDB + SSE -> Admin UI
 */

import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

interface AgentResponse {
  event_type: string;
  source_agent: string;
  result: string; // JSON string of the agent's structured response
  status: 'completed' | 'error';
  timestamp: string;
}

interface AgentResponseDocument {
  _id?: mongoose.Types.ObjectId;
  event_type: string;
  source_agent: string;
  result: Record<string, unknown>;
  status: string;
  timestamp: Date;
  processed: boolean;
}

// Agent response channel pattern
const RESPONSE_CHANNEL_PATTERN = 'agent_response:*';

class AgentEventService extends EventEmitter {
  private client: any = null;
  private subscriber: any = null;
  private isRunning = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Start the agent event listener.
   * Connects to Redis and subscribes to all agent response channels.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('AgentEventService is already running');
      return;
    }

    const redisUrl = env.REDIS_URL;
    if (!redisUrl) {
      logger.warn('REDIS_URL not configured, cannot start AgentEventService');
      return;
    }

    try {
      // Dynamic import of ioredis to avoid type issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require('ioredis') as any;

      // Create dedicated Redis connections for pub/sub
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          return Math.min(times * 200, 5000);
        },
      });

      this.subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          return Math.min(times * 200, 5000);
        },
      });

      // Handle connection events
      this.client.on('connect', () => {
        logger.info('AgentEventService Redis connected');
      });

      this.client.on('error', (err: Error) => {
        logger.error({ err: err.message }, 'AgentEventService Redis error');
      });

      this.subscriber.on('error', (err: Error) => {
        logger.error({ err: err.message }, 'AgentEventService subscriber error');
      });

      // Subscribe to all agent response channels using pattern
      await this.subscriber.psubscribe(RESPONSE_CHANNEL_PATTERN);

      this.subscriber.on('pmessage', async (_pattern: string, channel: string, message: string) => {
        await this.handleMessage(channel, message);
      });

      this.isRunning = true;
      logger.info('AgentEventService started, listening for agent responses');

      // Also poll for known channels as a fallback
      this.startChannelPolling();
    } catch (err) {
      logger.error({ err }, 'Failed to start AgentEventService');
      this.cleanup();
      // Retry after delay
      this.scheduleReconnect();
    }
  }

  /**
   * Handle an incoming message from an agent response channel.
   */
  private async handleMessage(channel: string, message: string): Promise<void> {
    try {
      const response: AgentResponse = JSON.parse(message);
      const eventType = channel.replace('agent_response:', '');

      logger.info(
        { event: eventType, agent: response.source_agent, status: response.status },
        'Agent response received'
      );

      // 1. Store response in MongoDB (audit trail)
      await this.storeResponse(response);

      // 2. Update related entity based on event type
      await this.processResponse(eventType, response);

      // 3. Emit event for SSE notification
      this.emit('agent_result', {
        event_type: eventType,
        agent: response.source_agent,
        data: response.result,
        status: response.status,
        timestamp: response.timestamp,
      });
    } catch (err) {
      logger.error({ err, channel }, 'Failed to process agent response');
    }
  }

  /**
   * Store agent response in MongoDB for audit trail.
   */
  private async storeResponse(response: AgentResponse): Promise<void> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        logger.error('MongoDB not connected');
        return;
      }

      const doc: AgentResponseDocument = {
        event_type: response.event_type,
        source_agent: response.source_agent,
        result: JSON.parse(response.result || '{}'),
        status: response.status,
        timestamp: new Date(response.timestamp),
        processed: true,
      };

      await db.collection('agent_responses').insertOne(doc);
      logger.debug({ event: response.event_type }, 'Stored agent response');
    } catch (err) {
      logger.error({ err }, 'Failed to store agent response');
    }
  }

  /**
   * Process agent response and update related entities.
   */
  private async processResponse(eventType: string, response: AgentResponse): Promise<void> {
    try {
      const result = JSON.parse(response.result || '{}');
      const db = mongoose.connection.db;
      if (!db) {
        logger.error('MongoDB not connected');
        return;
      }

      switch (eventType) {
        case 'InvoicePaid': {
          if (result.payload?.invoice_id) {
            await db.collection('invoices').updateOne(
              { invoice_id: result.payload.invoice_id },
              {
                $set: {
                  status: 'paid',
                  paid_date: new Date().toISOString(),
                  updated_at: new Date(),
                },
              }
            );
            logger.info({ invoice_id: result.payload.invoice_id }, 'Invoice marked as paid');
          }
          break;
        }

        case 'InvoiceSent': {
          if (result.payload?.invoice_id) {
            await db.collection('invoices').updateOne(
              { invoice_id: result.payload.invoice_id },
              {
                $set: {
                  status: 'sent',
                  sent_date: new Date().toISOString(),
                  updated_at: new Date(),
                },
              }
            );
          }
          break;
        }

        case 'LeadCreated':
        case 'LeadUpdated': {
          if (result.payload?.lead_id) {
            await db.collection('leads').updateOne(
              { lead_id: result.payload.lead_id },
              {
                $set: {
                  ai_processed: true,
                  ai_response: result.text_summary || '',
                  updated_at: new Date(),
                },
              }
            );
          }
          break;
        }

        case 'StockLow': {
          if (result.payload?.product_id) {
            await db.collection('product_stocks').updateOne(
              { product_id: result.payload.product_id },
              {
                $set: {
                  low_stock_alert_sent: true,
                  alert_sent_at: new Date(),
                },
              }
            );
          }
          break;
        }

        case 'ContentPublished': {
          if (result.payload?.content_id) {
            await db.collection('content_posts').updateOne(
              { _id: new mongoose.Types.ObjectId(result.payload.content_id) },
              {
                $set: {
                  ai_publish_confirmed: true,
                  updated_at: new Date(),
                },
              }
            );
          }
          break;
        }

        default:
          logger.debug({ event: eventType }, 'No specific entity update for event type');
      }
    } catch (err) {
      logger.error({ err, eventType }, 'Failed to process response');
    }
  }

  /**
   * Poll known response channels as a fallback for missed psubscribe messages.
   */
  private startChannelPolling(): void {
    const knownChannels = [
      'agent_response:LeadCreated',
      'agent_response:LeadUpdated',
      'agent_response:LeadAssigned',
      'agent_response:InquiryReceived',
      'agent_response:InvoiceCreated',
      'agent_response:InvoicePaid',
      'agent_response:InvoiceSent',
      'agent_response:QuotationSent',
      'agent_response:ContentRequested',
      'agent_response:ContentPublished',
      'agent_response:BlogDraftRequested',
      'agent_response:SocialPostScheduled',
      'agent_response:ProductUpdated',
      'agent_response:StockLow',
      'agent_response:StockReordered',
      'agent_response:InstallationScheduled',
      'agent_response:DemoBooked',
      'agent_response:SiteVisitScheduled',
    ];

    // Check channels every 10 seconds as fallback
    this.pollingTimer = setInterval(async () => {
      if (!this.client) return;

      for (const channel of knownChannels) {
        try {
          const result = await this.client.lpop(channel);
          if (result) {
            await this.handleMessage(channel, result);
          }
        } catch {
          // Silently ignore polling errors
        }
      }
    }, 10000);
  }

  /**
   * Send SSE notification to connected admin clients.
   */
  notifyAdmin(data: {
    event_type: string;
    agent: string;
    data: unknown;
    status: string;
    timestamp: string;
  }): void {
    this.emit('admin_notification', data);
  }

  /**
   * Schedule a reconnection attempt.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      logger.info('Attempting to reconnect AgentEventService...');
      await this.start();
    }, 5000);
  }

  /**
   * Clean up Redis connections.
   */
  private cleanup(): void {
    if (this.subscriber) {
      this.subscriber.disconnect();
      this.subscriber = null;
    }
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Stop the agent event listener.
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.cleanup();
    logger.info('AgentEventService stopped');
  }

  /**
   * Get recent agent responses for debugging.
   */
  async getRecentResponses(limit: number = 50): Promise<AgentResponseDocument[]> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        return [];
      }

      const results = await db
        .collection('agent_responses')
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return results as AgentResponseDocument[];
    } catch (err) {
      logger.error({ err }, 'Failed to fetch recent responses');
      return [];
    }
  }
}

// Singleton instance
export const agentEventService = new AgentEventService();
