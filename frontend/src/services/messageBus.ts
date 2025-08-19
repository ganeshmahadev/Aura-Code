/**
 * MESSAGE BUS - HIGH-LEVEL MESSAGE ROUTING SYSTEM
 * 
 * This class sits between WebSocketBus (low-level connection) and useMessageBus (React hook).
 * It provides a publish-subscribe pattern for handling different types of messages from the AI agent.
 * 
 * COMMUNICATION LAYER ARCHITECTURE:
 * React Components → useMessageBus → MessageBus → WebSocketBus → AI Agent
 * 
 * PURPOSE:
 * 1. MESSAGE ROUTING: Routes different message types to appropriate handlers
 * 2. DECOUPLING: Separates WebSocket concerns from business logic
 * 3. EXTENSIBILITY: Easy to add new message types and handlers
 * 4. ERROR HANDLING: Centralizes error processing and recovery
 * 
 */
import type { Message } from '../types/messages';
import { MessageType, createMessage } from '../types/messages';

export interface MessageHandler {
  (message: Message): void;
}

export interface MessageBusConfig {
  onMessage?: (message: Message) => void;    // Global handler for all messages
  onError?: (error: string) => void;         // Error handler
  onConnect?: () => void;                    // Connection established
  onDisconnect?: () => void;                 // Connection lost
}

export class MessageBus {
  /**
   * MESSAGE BUS CLASS - Central message routing and event management
   * This class implements a publish-subscribe pattern where:
   * - Components register handlers for specific message types
   * - WebSocket messages are routed to appropriate handlers
   * - Multiple handlers can listen to the same message type
   * - Error handling is centralized and propagated up
   */
  
  // Map of message types to sets of handlers (allows multiple handlers per type)
  private handlers: Map<MessageType, Set<MessageHandler>> = new Map();
  
  // Configuration for global handlers and callbacks
  private config: MessageBusConfig;
  
  // Connection state for UI indicators
  private isConnected = false;

  constructor(config: MessageBusConfig = {}) {
    this.config = config;
  }

  /**
   * HANDLER REGISTRATION - Subscribe to specific message types
   * 
   * Example usage in React components:
   * messageBus.on(MessageType.AGENT_PARTIAL, (message) => {
   *   setAIResponse(message.data.text);
   * });
   * 
   * Returns unsubscribe function for cleanup.
   */
  public on(type: MessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    
    // Return unsubscribe function for React useEffect cleanup
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * MESSAGE EMISSION - Route incoming messages to registered handlers
   * 
   * This is called by WebSocketBus when messages arrive from the AI agent.
   * Messages are routed to:
   * 1. Global handler (if configured) - for logging, debugging
   * 2. Type-specific handlers - for business logic processing
   * 
   * Error handling ensures one failing handler doesn't break others.
   */
  public emit(message: Message): void {
    console.log('MessageBus emitting:', message);
    
    // Call global handler if registered (used by useMessageBus for general processing)
    this.config.onMessage?.(message);
    
    // Call all specific handlers registered for this message type
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
          // Propagate handler errors without stopping other handlers
          this.config.onError?.(`Handler error: ${error}`);
        }
      });
    }
  }

  // Send a message with automatic type creation
  public send(type: MessageType, data: Record<string, any> = {}, id?: string): void {
    const message = createMessage(type, data, id);
    this.emit(message);
  }

  // Send error message
  public sendError(error: string, data: Record<string, any> = {}): void {
    this.send(MessageType.ERROR, { error, ...data });
  }

  // Connection state management
  public setConnected(connected: boolean): void {
    this.isConnected = connected;
    if (connected) {
      this.config.onConnect?.();
    } else {
      this.config.onDisconnect?.();
    }
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  // Clear all handlers
  public clear(): void {
    this.handlers.clear();
  }
} 