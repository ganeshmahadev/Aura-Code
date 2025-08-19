/**
 * WEBSOCKET BUS - LOW-LEVEL WEBSOCKET CONNECTION MANAGER
 * 
 * This class handles the raw WebSocket or browser websocket API connection to the AI Agent running on Beam Cloud.
 * It's responsible for:
 * 
 * 1. FRONTEND → AGENT COMMUNICATION ARCHITECTURE:
 *    Frontend (React) → WebSocketBus → Beam Cloud Agent → AI Processing
 *                    ↑ Real-time WebSocket Connection
 * 
 * 2. CONNECTION MANAGEMENT:
 *    - Establishes secure WebSocket connection with auth token
 *    - Handles connection state (connecting, connected, disconnected)
 *    - Implements automatic reconnection with exponential backoff
 *    - Manages authentication via URL parameters
 * 
 * 3. MESSAGE FLOW:
 *    - Serializes outgoing messages to JSON for wire transmission
 *    - Deserializes incoming messages and validates message types
 *    - Routes messages through MessageBus for higher-level handling
 *    - Handles special message types (PING, INIT) automatically
 * 
 * 4. SESSION RESTORATION:
 *    - Sends INIT message with existing sandbox_id for session restoration
 *    - Enables seamless continuation of previous development sessions
 *    - Maintains session context across browser refreshes
 * 
 * WebSocket URL Format: wss://lovable-agent-32a2c27-v4.app.beam.cloud?auth_token=...
 */
import { MessageBus } from './messageBus';
import type { Message } from '../types/messages';
import { MessageType, createMessage } from '../types/messages';

export interface WebSocketBusConfig {
  url: string;                    // Beam Cloud agent WebSocket URL
  token: string;                  // Authentication token for secure connection
  messageBus: MessageBus;         // Higher-level message routing system
  initData?: {                    // Optional data for session restoration
    sandbox_id?: string;          // Existing sandbox to restore (vs creating new one)
    sessionId?: string;           // Database session ID for chat history
    [key: string]: any;           // Additional restoration parameters
  };
}

export class WebSocketBus {
  /**
   * WEBSOCKET BUS CLASS - Manages direct connection to AI Agent
   * 
   * This class is the lowest layer in the communication stack:
   * React Component → useMessageBus → MessageBus → WebSocketBus → Agent
   */
  
  // Core WebSocket connection instance
  private ws: WebSocket | null = null;
  
  // Configuration including agent URL, auth token, and restoration data
  private config: WebSocketBusConfig;
  
  // Connection state management
  private isReady = false;                    // True when connection is established and ready
  private reconnectAttempts = 0;              // Current number of reconnection attempts
  private maxReconnectAttempts = 5;           // Max attempts before giving up
  private reconnectDelay = 1000;              // Base delay in ms, grows exponentially

  constructor(config: WebSocketBusConfig) {
    this.config = config;
  }

  /**
   * WEBSOCKET URL CONSTRUCTION
   * 
   * Builds authenticated WebSocket URL for connecting to Beam Cloud agent.
   * Format: wss://lovable-agent-32a2c27-v4.app.beam.cloud?auth_token=xyz
   * 
   * The auth_token parameter enables secure communication with the agent.
   */
  private websocketUrl(): string {
    if (!this.config.url || !this.config.token) {
      throw new Error(`Invalid WebSocket configuration: url=${this.config.url}, token=${!!this.config.token}`);
    }
    
    try {
      // Parse base URL and add authentication token as query parameter
      const url = new URL(this.config.url);
      url.searchParams.set('auth_token', this.config.token);
      return url.toString();
    } catch (error) {
      throw new Error(`Invalid WebSocket URL: ${this.config.url} - ${error}`);
    }
  }

  /**
   * MAIN CONNECTION METHOD - Establishes WebSocket connection to AI Agent
   * 
   * FRONTEND → AGENT COMMUNICATION FLOW:
   * 1. Creates WebSocket connection to Beam Cloud agent
   * 2. Sets up event handlers for messages, connection, disconnection, errors
   * 3. Sends INIT message with session restoration data (if available)
   * 4. Waits for connection to be ready before returning
   * 
   * This method handles the complete connection lifecycle.
   */
  public async connect(): Promise<WebSocket> {
    const wsUrl = this.websocketUrl();
    console.log('Connecting to WebSocket URL:', wsUrl);
    console.log('Config URL:', this.config.url);
    console.log('Config token:', this.config.token ? 'Present' : 'Missing');
    this.ws = new WebSocket(wsUrl);

    // MESSAGE RECEPTION HANDLER - Processes incoming messages from AI Agent
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        // Parse JSON message from agent
        const rawMessage = JSON.parse(event.data);
        console.log('Received WebSocket message:', rawMessage);
        
        // Convert raw message to typed Message object
        const message = this.convertRawMessage(rawMessage);
        if (message) {
          // Handle ping messages automatically for connection health
          if (message.type === MessageType.PING) {
            this.sendMessage(createMessage(MessageType.PING, {}));
          }
          // Route message through MessageBus to higher-level handlers
          this.config.messageBus.emit(message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        // Send error through MessageBus for UI error handling
        this.config.messageBus.sendError('Failed to parse message', { 
          rawData: event.data,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    // CONNECTION ESTABLISHED HANDLER
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isReady = true;
      this.reconnectAttempts = 0;
      this.config.messageBus.setConnected(true);
      
      // If we have existing session data (sandbox_id, sessionId), send it in INIT
      // This tells the agent to restore an existing sandbox instead of creating new one
      const initData = this.config.initData || {};
      console.log('Sending INIT with data:', initData);
      console.log('WebSocket connected, sending INIT message for session restoration');
      
      if (initData.sandbox_id) {
        console.log('🔄 Restoring existing sandbox with ID:', initData.sandbox_id);
        console.log('This should restore all files from the previous session');
        console.log('Expected behavior: Server should restore existing sandbox, not create new one');
      } else {
        console.log('🆕 Creating new sandbox (no sandbox_id provided)');
        console.log('This will create a new sandbox with template files');
        console.log('Expected behavior: Server should create new sandbox with template files');
      }
      
      // Send INIT message to agent - this triggers sandbox creation/restoration
      this.sendMessage(createMessage(MessageType.INIT, initData));
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.isReady = false;
      this.config.messageBus.setConnected(false);
      
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      const errorMessage = error instanceof Error ? error.message : 'WebSocket connection error';
      this.config.messageBus.sendError(errorMessage, { 
        originalError: error
      });
    };

    // Wait for connection to be ready
    while (!this.isReady) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!this.ws) {      throw new Error('WebSocket connection failed');
    }

    return this.ws;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isReady) {
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  private convertRawMessage(rawMessage: any): Message | null {
    if (!rawMessage || (typeof rawMessage === 'object' && Object.keys(rawMessage).length === 0)) {
      return null;
    }

    // Handle different message formats from the server
    if (rawMessage.type) {
      // Check if the raw type is a valid MessageType enum value
      if (Object.values(MessageType).includes(rawMessage.type)) {
        return createMessage(rawMessage.type as MessageType, {
          ...rawMessage.data,
          text: rawMessage.data?.text,
          error: rawMessage.error
        }, rawMessage.id, rawMessage.timestamp);
      }
    }

    // Handle nested data format
    if (rawMessage.data && rawMessage.data.type) {
      if (Object.values(MessageType).includes(rawMessage.data.type)) {
        return createMessage(rawMessage.data.type as MessageType, {
          ...rawMessage.data,
          text: rawMessage.data.text || rawMessage.text,
          error: rawMessage.data.error || rawMessage.error
        }, rawMessage.id, rawMessage.timestamp);
      }
    }

    return null;
  }

  public sendMessage(message: Message): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: message.type,
        data: message.data,
        id: message.id,
        timestamp: message.timestamp
      };
      
      const messageStr = JSON.stringify(wsMessage);
      console.log('Sending WebSocket message:', messageStr);
      this.ws.send(messageStr);
    } else {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
      this.isReady = false;
    }
  }

  public getConnected(): boolean {
    return this.isReady && this.ws?.readyState === WebSocket.OPEN;
  }
}

export const createWebSocketBus = (
  url: string,
  token: string,
  messageBus: MessageBus
): WebSocketBus => {
  return new WebSocketBus({ url, token, messageBus });
}; 