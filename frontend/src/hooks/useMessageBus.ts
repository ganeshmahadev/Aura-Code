/**
 * useMessageBus Hook - REACT INTERFACE FOR AI AGENT COMMUNICATION
 * 
 * This is the highest-level interface for frontend ↔ agent communication.
 * It's a React hook that manages the complete WebSocket communication stack.
 * 

 * KEY RESPONSIBILITIES:
 * 1. Connection Management: Establishes and maintains WebSocket connection
 * 2. Session Restoration: Handles restoration of existing sandboxes/sessions
 * 3. Message Handling: Processes different types of messages from AI agent
 * 4. Error Recovery: Automatic reconnection with exponential backoff
 * 5. React Integration: Provides loading states, error states, connection status
 * 
 * FRONTEND → AGENT COMMUNICATION FLOW:
 * 1. User types message → Component calls send() → WebSocket → Agent
 * 2. Agent processes → BAML Client → OpenAI → Code generation
 * 3. Agent streams response → WebSocket → MessageBus → Handler → UI Update
 * 4. Agent updates sandbox → Live preview refreshes automatically
 * 
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageBus } from "../services/messageBus";
import { WebSocketBus } from "../services/websocketBus";
import type { Message } from "../types/messages";
import { MessageType } from "../types/messages";

/**
 * HOOK CONFIGURATION INTERFACE
 * 
 * Defines all parameters needed to establish communication with AI agent
 */
interface UseMessageBusConfig {
  wsUrl: string;                    // WebSocket URL for AI agent (from Beam Cloud)
  token: string;                    // Authentication token for secure connection
  initData?: {                      // Optional session restoration data
    sandbox_id?: string;            // Existing sandbox ID to restore (vs creating new)
    sessionId?: string;             // Database session ID for chat history
    [key: string]: any;             // Additional restoration parameters
  };
  handlers?: {                      // Message type handlers for processing AI responses
    [K in MessageType]?: (message: Message) => void;
  };
  onConnect?: () => void;           // Callback when connection established
  onDisconnect?: () => void;        // Callback when connection lost
  onError?: (error: string) => void; // Callback for connection/message errors
}

/**
 * HOOK RETURN INTERFACE  
 * 
 * Provides React components with connection state and communication methods
 */
interface UseMessageBusReturn {
  isConnecting: boolean;            // True while establishing initial connection
  isConnected: boolean;             // True when ready to send/receive messages
  error: string | null;             // Latest error message (null if no error)
  connect: () => Promise<void>;     // Method to establish connection
  disconnect: () => void;           // Method to close connection cleanly
  send: (type: MessageType, payload: Record<string, any>) => void; // Send message to agent
}

/**
 * MAIN HOOK IMPLEMENTATION
 * 
 * This hook orchestrates the entire frontend ↔ agent communication system.
 * It manages the complex interaction between React lifecycle, WebSocket connections,
 * message routing, and error handling.
 */
export const useMessageBus = ({
  wsUrl,
  token,
  initData,
  handlers = {},
  onConnect,
  onDisconnect,
  onError,
}: UseMessageBusConfig): UseMessageBusReturn => {
  
  // REACT STATE MANAGEMENT
  // These states drive UI indicators (loading spinners, error messages, connection status)
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PERSISTENT REFERENCES
  // These refs maintain stable references across React re-renders
  const messageBusRef = useRef<MessageBus | null>(null);     // High-level message router
  const webSocketRef = useRef<WebSocketBus | null>(null);    // Low-level WebSocket manager
  const handlersRef = useRef(handlers);                      // Latest message handlers

  // HANDLER REFERENCE UPDATES
  // Keep handlers ref current when parent component updates handlers
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // MESSAGE BUS INITIALIZATION
  // Sets up the central message routing system that connects WebSocket to React handlers
  useEffect(() => {
    messageBusRef.current = new MessageBus({
      //crete MessageBus to handle messages from the AI agent
      onMessage: (message) => {
        console.log('MessageBus received:', message);
        
        // Route message to specific handler based on type (AGENT_PARTIAL, INIT, etc.)
        const handler = handlersRef.current[message.type];
        if (handler) {
          try {
            // Execute the React component's handler for this message type
            handler(message);
          } catch (error) {
            console.error(`Error in handler for ${message.type}:`, error);
            onError?.(`Handler error for ${message.type}: ${error}`);
          }
        } else {
          // Log unhandled message types for debugging
          console.log(`No handler registered for message type: ${message.type}`);
        }
      },
      
      // ERROR HANDLING - Propagates connection and message errors to React state
      onError: (errorMsg) => {
        console.error('MessageBus error:', errorMsg);
        setError(errorMsg);
        onError?.(errorMsg);
      },
      
      // CONNECTION STATE MANAGEMENT - Updates React state for UI indicators
      onConnect: () => {
        console.log('MessageBus connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        onConnect?.();
      },
      onDisconnect: () => {
        console.log('MessageBus disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();
      }
    });

    // Cleanup on unmount - prevents memory leaks
    return () => {
      messageBusRef.current?.clear();
    };
  }, [onConnect, onDisconnect, onError]);


  /**
   * CONNECTION METHOD - Establishes WebSocket connection to AI agent
   * 
   * COMPLETE CONNECTION FLOW:
   * 1. Validates configuration (URL, token)
   * 2. Creates WebSocketBus 
   * 3. Establishes WebSocket connection to Beam Cloud agent
   * 4. Sends INIT message with session/sandbox restoration data
   * 5. Updates React state to indicate connection success/failure
   * 
   * SESSION RESTORATION:
   * If initData contains sandbox_id, agent will restore existing sandbox
   * instead of creating a new one. This enables seamless session continuation.
   */
  const connect = useCallback(async () => {
    if (!messageBusRef.current) {
      throw new Error('MessageBus not initialized');
    }

    // Validate required connection parameters
    if (!wsUrl || !token) {
      const errorMsg = `Invalid connection configuration: wsUrl=${!!wsUrl}, token=${!!token}`;
      console.error(errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create WebSocket connection 
      webSocketRef.current = new WebSocketBus({ 
        url: wsUrl,                           // AI agent WebSocket URL
        token,                                // Authentication token
        messageBus: messageBusRef.current,    // Message routing system
        initData                              // Session/sandbox restoration data
      });
      
      // Establish connection - this will trigger INIT message with restoration data
      await webSocketRef.current.connect();
    } catch (err) {
      console.error("Failed to connect:", err);
      setIsConnecting(false);
      setIsConnected(false);
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [wsUrl, token, initData]);

  const disconnect = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.disconnect();
      webSocketRef.current = null;
    }
  }, []);

  const send = useCallback((type: MessageType, payload: Record<string, any> = {}) => {
    if (isConnected && webSocketRef.current) {
      try {
        console.log("Sending message:", { type, payload });
        webSocketRef.current.sendMessage({
          type,
          data: payload,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to send message. Please check your connection.");
      }
    } else {
      setError("Not connected to Workspace.");
    }
  }, [isConnected]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    send,
  };
}; 