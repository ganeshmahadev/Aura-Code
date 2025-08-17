import {
  ComputerIcon,
  ExternalLink,
  Heart,
  Loader2,
  PhoneIcon,
  Play,
  RotateCcw,
  TabletIcon,
} from "lucide-react";
import { MessageType, Sender } from "../../types/messages";
import { useCallback, useEffect, useRef, useState } from "react";

import { BEAM_CONFIG } from "../../config/beam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "../../types/messages";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useMessageBus } from "../../hooks/useMessageBus";
import CodeViewer from "../../components/CodeViewer";
import LovableIcon from "@/components/lovable-icon";
import { useAuth } from "../../contexts/AuthContext";
import { createSession, updateSession, getSession } from "../../lib/sessions";
import type { Session } from "../../lib/supabase";

const DEVICE_SPECS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: "100%", height: "100%" },
};

const Create = () => {
  const [inputValue, setInputValue] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [iframeUrl, setIframeUrl] = useState("");
  const [iframeError, setIframeError] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);
  const [initCompleted, setInitCompleted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasConnectedRef = useRef(false);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const location = useLocation();
  const navigate = useNavigate();
  const initialPromptSent = useRef(false);
  const [selectedDevice, setSelectedDevice] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [codeFiles, setCodeFiles] = useState<Record<string, string>>({});
  const [sandboxId, setSandboxId] = useState<string>("");
  const sandboxIdRef = useRef<string>("");
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const { user } = useAuth();

  // Initialize theme from navigation state
  useEffect(() => {
    if (location.state && location.state.isDarkMode !== undefined) {
      setIsDarkMode(location.state.isDarkMode);
    }
  }, [location.state]);

  // Initialize or load session
  useEffect(() => {
    const initializeSession = async () => {
      if (!user) return;

      const sessionId = location.state?.sessionId;
      
      if (sessionId) {
        // Load existing session
        try {
          const session = await getSession(sessionId);
          setCurrentSession(session);
          if (session.sandbox_id) {
            setSandboxId(session.sandbox_id);
            sandboxIdRef.current = session.sandbox_id;
          }
          if (session.iframe_url) {
            setIframeUrl(session.iframe_url);
          }
        } catch (error) {
          console.error('Error loading session:', error);
        }
      } else {
        // Create new session
        const title = location.state?.initialPrompt || "New Project";
        try {
          const session = await createSession(title, "Created with AuraCode");
          setCurrentSession(session);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    };

    initializeSession();
  }, [user, location.state]);


  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 144; // 6 lines * 24px
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  // Adjust textarea height when input value changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const refreshIframe = useCallback(() => {
    if (iframeRef.current && iframeUrl && iframeUrl !== "/") {
      setIframeReady(false);
      setIframeError(false);

      // First refresh
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "";

      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;

          // Second refresh after a longer delay
          setTimeout(() => {
            if (iframeRef.current) {
              iframeRef.current.src = "";

              setTimeout(() => {
                if (iframeRef.current) {
                  iframeRef.current.src = currentSrc;
                }
              }, 200);
            }
          }, 500);
        }
      }, 300);
    }
  }, [iframeUrl]);

  // Message handlers for different message types
  const messageHandlers = {
    [MessageType.INIT]: (message: Message) => {
      const id = message.id;
      if (id) {
        if (processedMessageIds.current.has(id)) {
          console.log("Skipping duplicate INIT message:", id);
          return;
        }
        processedMessageIds.current.add(id);
        console.log("Processing INIT message:", id);
      }

      if (typeof message.data.url === "string" && message.data.sandbox_id) {
        setIframeUrl(message.data.url);
        setSandboxId(message.data.sandbox_id);
        sandboxIdRef.current = message.data.sandbox_id;
        setIframeError(false);
        // Fetch initial code files
        fetchCodeFiles(message.data.sandbox_id);
        
        // Update session with sandbox and URL info
        if (currentSession && user) {
          updateSession(currentSession.id, {
            sandbox_id: message.data.sandbox_id,
            iframe_url: message.data.url,
            is_active: true
          }).catch(error => console.error('Error updating session:', error));
        }
      }

      setMessages((prev) => {
        if (id) {
          const existingIndex = prev.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            // Update in place
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? {
                    ...msg,
                    timestamp: message.timestamp || msg.timestamp,
                    data: {
                      ...msg.data,
                      text: "Workspace loaded! You can now make edits here.",
                      sender: Sender.ASSISTANT,
                    },
                  }
                : msg
            );
          }
        }
        // Insert new
        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: "Workspace loaded! You can now make edits here.",
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
      setInitCompleted(true);
    },

    [MessageType.ERROR]: (message: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          timestamp: message.timestamp || Date.now(),
          data: {
            ...message.data,
            sender: Sender.ASSISTANT,
          },
        },
      ]);
    },

    [MessageType.AGENT_PARTIAL]: (message: Message) => {
      const text = message.data.text;
      const id = message.id;

      if (!id) {
        console.warn("AGENT_PARTIAL message missing id, ignoring:", message);
        return;
      }

      if (text && text.trim()) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? {
                    ...msg,
                    timestamp: message.timestamp || msg.timestamp,
                    data: {
                      ...msg.data,
                      text: text.replace(/\\/g, ""),
                      sender: Sender.ASSISTANT,
                      isStreaming: true,
                    },
                  }
                : msg
            );
          }
          // Insert new
          return [
            ...prev,
            {
              ...message,
              timestamp: message.timestamp || Date.now(),
              data: {
                ...message.data,
                text: text.replace(/\\/g, ""),
                isStreaming: true,
                sender: Sender.ASSISTANT,
              },
            },
          ];
        });
      }
    },

    [MessageType.AGENT_FINAL]: (message: Message) => {
      const text = message.data.text;
      const id = message.id;
      if (!id) {
        console.warn("AGENT_FINAL message missing id, ignoring:", message);
        return;
      }
      if (text && text.trim()) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? {
                    ...msg,
                    timestamp: message.timestamp || msg.timestamp,
                    data: {
                      ...msg.data,
                      text: text.replace(/\\/g, ""),
                      isStreaming: false,
                      sender: Sender.ASSISTANT,
                    },
                  }
                : msg
            );
          }
          // Insert new
          return [
            ...prev,
            {
              ...message,
              timestamp: message.timestamp || Date.now(),
              data: {
                ...message.data,
                text: text.replace(/\\/g, ""),
                isStreaming: false,
                sender: Sender.ASSISTANT,
              },
            },
          ];
        });
      }
    },

    [MessageType.UPDATE_IN_PROGRESS]: (message: Message) => {
      setIsUpdateInProgress(true);

      const id = message.id;

      setMessages((prev) => {
        if (id) {
          const existingIndex = prev.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? {
                    ...msg,
                    timestamp: message.timestamp || msg.timestamp,
                    data: {
                      ...msg.data,
                      text: "Ok - I'll make those changes!",
                      sender: Sender.ASSISTANT,
                    },
                  }
                : msg
            );
          }
        }

        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: "Ok - I'll make those changes!",
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
    },

    [MessageType.UPDATE_FILE]: (message: Message) => {
      const id = message.id;
      if (!id) {
        console.warn("UPDATE_FILE message missing id, ignoring:", message);
        return;
      }
      setMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === id);
        if (existingIndex !== -1) {
          return prev.map((msg, idx) =>
            idx === existingIndex
              ? {
                  ...msg,
                  timestamp: message.timestamp || msg.timestamp,
                  data: {
                    ...msg.data,
                    text: message.data.text,
                    sender: Sender.ASSISTANT,
                    isStreaming: true,
                  },
                }
              : msg
          );
        }
        // Insert new
        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: message.data.text,
              sender: Sender.ASSISTANT,
              isStreaming: true,
            },
          },
        ];
      });
    },

    [MessageType.UPDATE_COMPLETED]: (message: Message) => {
      setIsUpdateInProgress(false);
      const id = message.id;
      setMessages((prev) => {
        // Remove all UPDATE_FILE messages
        const filtered = prev.filter(
          (msg) => msg.type !== MessageType.UPDATE_FILE
        );

        if (id) {
          const existingIndex = filtered.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            return filtered.map((msg, idx) =>
              idx === existingIndex
                ? {
                    ...msg,
                    timestamp: message.timestamp || msg.timestamp || Date.now(),
                    data: {
                      ...msg.data,
                      text: "Update completed!",
                      sender: Sender.ASSISTANT,
                    },
                  }
                : msg
            );
          }
        }
        // Insert new
        return [
          ...filtered,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: "Update completed!",
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
      refreshIframe();
      // Refetch code files if we're in code view or have fetched them before
      if (sandboxIdRef.current && (viewMode === "code" || Object.keys(codeFiles).length > 0)) {
        fetchCodeFiles(sandboxIdRef.current);
      }
    },

    [MessageType.CODE_DISPLAY_RESPONSE]: (message: Message) => {
      if (message.data.files) {
        setCodeFiles(message.data.files);
        console.log("Received code files:", Object.keys(message.data.files));
      }
    },
  };

  const { isConnected, error, connect, send } = useMessageBus({
    wsUrl: BEAM_CONFIG.WS_URL,
    token: BEAM_CONFIG.TOKEN,
    handlers: messageHandlers,
    onConnect: () => {
      console.log("Connected to Beam Cloud");
    },
    onDisconnect: () => {
      hasConnectedRef.current = false;
    },
    onError: (errorMsg) => {
      console.error("Connection error:", errorMsg);

      let errorString = "Unknown connection error";
      if (typeof errorMsg === "string") {
        errorString = errorMsg;
      } else if (errorMsg && typeof errorMsg === "object") {
        const errorObj = errorMsg as { message?: unknown };
        if (errorObj.message) {
          errorString = String(errorObj.message);
        }
      }

      console.error("Processed error:", errorString);
    },
  });

  // Define fetchCodeFiles after send is available
  const fetchCodeFiles = useCallback((sandbox_id: string) => {
    try {
      console.log("Fetching code files for sandbox:", sandbox_id);
      send(MessageType.GET_CODE_FOR_DISPLAY, { sandbox_id });
    } catch (error) {
      console.error("Failed to fetch code files:", error);
    }
  }, [send]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        setSidebarWidth(Math.max(300, Math.min(800, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      send(MessageType.USER, { text: inputValue });
      
      // Update session title if this is the first message and it's a new session
      if (currentSession && messages.length === 0 && user) {
        const title = inputValue.length > 50 ? inputValue.substring(0, 50) + "..." : inputValue;
        updateSession(currentSession.id, { title }).catch(error => 
          console.error('Error updating session title:', error)
        );
      }
      
      setInputValue("");
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.USER,
          timestamp: Date.now(),
          data: {
            text: inputValue,
            sender: Sender.USER,
          },
        },
      ]);
      // Reset textarea height after sending
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = '48px';
        }
      }, 0);
    }
  };

  useEffect(() => {
    if (iframeUrl && isConnected) {
      setIframeError(false);
    }
  }, [iframeUrl, isConnected]);

  const handleIframeLoad = () => {
    console.log("Iframe loaded successfully:", iframeUrl);
    setIframeError(false);
    setIframeReady(true);
  };

  const handleIframeError = () => {
    console.error("Iframe failed to load:", iframeUrl);
    setIframeError(true);
  };

  // Simple auto-connect
  useEffect(() => {
    if (!isConnected && !hasConnectedRef.current) {
      console.log("Connecting to Workspace");
      hasConnectedRef.current = true;
      connect();
    }
  }, [isConnected, connect]);

  // Clear processed message IDs when connection is lost
  useEffect(() => {
    if (!isConnected) {
      processedMessageIds.current.clear();
    }
  }, [isConnected]);

  useEffect(() => {
    setIframeReady(false);
  }, [iframeUrl]);

  useEffect(() => {
    if (
      initCompleted &&
      location.state &&
      location.state.initialPrompt &&
      !initialPromptSent.current
    ) {
      // Send as user message (so it appears in chat)
      send(MessageType.USER, { text: location.state.initialPrompt });
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.USER,
          timestamp: Date.now(),
          data: {
            text: location.state.initialPrompt,
            sender: Sender.USER,
          },
        },
      ]);
      initialPromptSent.current = true;
    }
  }, [initCompleted, location.state, send, setMessages]);

  const LoadingState = () => (
    <IframeErrorContainer>
      <SpinningIcon>
        <Loader2 size={64} />
      </SpinningIcon>
      <AnimatedText isDark={isDarkMode} style={{ marginTop: "24px" }}>
        Connecting to Workspace...
      </AnimatedText>
      <p style={{ marginTop: "12px", textAlign: "center", color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#1a1a1a' }}>
        Please wait while we setup your workspace and load the website.
      </p>
    </IframeErrorContainer>
  );

  const UpdateInProgressState = () => (
    <IframeErrorContainer>
      <SpinningIcon>
        <Loader2 size={64} />
      </SpinningIcon>
      <AnimatedText isDark={isDarkMode} style={{ marginTop: "24px" }}>
        Updating Workspace...
      </AnimatedText>
      <p style={{ marginTop: "12px", textAlign: "center", color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#1a1a1a' }}>
        Please wait while we apply your changes to the website.
      </p>
    </IframeErrorContainer>
  );

  return (
    <PageContainer isDark={isDarkMode}>
      <Sidebar isDark={isDarkMode} style={{ width: `${sidebarWidth}px` }}>
        <BeamHeader>
          <Logo onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <LogoIcon>
              <LovableIcon size={14} />
            </LogoIcon>
            <LogoText isDark={isDarkMode}>AuraCode</LogoText>
          </Logo>
        </BeamHeader>

        <ChatHistory ref={chatHistoryRef}>
          {messages
            .filter(
              (msg) =>
                msg.data.text &&
                typeof msg.data.text === "string" &&
                msg.data.text.trim()
            )
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            .map((msg, index) => (
              <MessageContainer
                key={msg.id || `msg-${index}-${msg.timestamp || Date.now()}`}
                isUser={msg.data.sender === Sender.USER}
              >
                <MessageBubble
                  isUser={msg.data.sender === Sender.USER}
                  isDark={isDarkMode}
                >
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      color: msg.data.sender === Sender.USER 
                        ? "white" 
                        : (isDarkMode ? "rgba(255, 255, 255, 0.9)" : "#1a1a1a"),
                    }}
                  >
                    {String(msg.data.text || "")}
                  </p>
                  {msg.data.isStreaming && (
                    <TypingIndicator>
                      <TypingDot />
                      <TypingDot />
                      <TypingDot />
                    </TypingIndicator>
                  )}
                </MessageBubble>
              </MessageContainer>
            ))}
        </ChatHistory>

        <ChatInputContainer isDark={isDarkMode}>
          <StyledTextarea
            placeholder="Ask Aura..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isConnected || !iframeReady}
            isDark={isDarkMode}
            rows={1}
            ref={textareaRef}
          />
          <ArrowButton
            onClick={handleSendMessage}
            disabled={!isConnected || !iframeReady || !inputValue.trim()}
            isDark={isDarkMode}
          >
            <ArrowIcon isDark={isDarkMode}>↑</ArrowIcon>
          </ArrowButton>
        </ChatInputContainer>
      </Sidebar>

      <ResizeHandle onMouseDown={() => setIsResizing(true)} />

      <MainContent hasIframe={!!iframeUrl} isDark={isDarkMode} className="bg-card">
        {isConnected ? (
          <IframeContainer>
            <UrlBarContainer isDark={isDarkMode}>
              <CodeToggleButton
                isDark={isDarkMode}
                disabled={
                  !iframeUrl ||
                  !iframeReady ||
                  isUpdateInProgress ||
                  !initCompleted
                }
                onClick={() => {
                  const newViewMode = viewMode === "preview" ? "code" : "preview";
                  setViewMode(newViewMode);
                  if (newViewMode === "code" && sandboxId && Object.keys(codeFiles).length === 0) {
                    fetchCodeFiles(sandboxId);
                  }
                }}
                title={viewMode === "preview" ? "View Code" : "View Preview"}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M9.81175,1.23848 C10.3070964,1.37121929 10.6154651,1.85349541 10.5425767,2.3488407 L10.5189,2.46323 L7.41303,14.0543 C7.27009,14.5878 6.72175,14.9044 6.18828,14.7614 C5.69292429,14.6287071 5.38457224,14.1464602 5.45749504,13.6510948 L5.48118,13.5367 L8.58701,1.94559 C8.72995,1.41213 9.27829,1.09554 9.81175,1.23848 Z M4.70711,4.29288 C5.09763,4.68341 5.09763,5.31657 4.70711,5.7071 L2.41421,7.99999 L4.70711,10.2929 C5.09763,10.6834 5.09763,11.3166 4.70711,11.7071 C4.31658,12.0976 3.68342,12.0976 3.29289,11.7071 L0.292893,8.7071 C-0.0976311,8.31657 -0.0976311,7.68341 0.292893,7.29288 L3.29289,4.29288 C3.68342,3.90236 4.31658,3.90236 4.70711,4.29288 Z M11.2929,4.29288 C11.6533615,3.9324 12.2206207,3.90467077 12.6128973,4.20969231 L12.7071,4.29288 L15.7071,7.29288 C16.0675615,7.65336923 16.0952893,8.22059645 15.7902834,8.61289152 L15.7071,8.7071 L12.7071,11.7071 C12.3166,12.0976 11.6834,12.0976 11.2929,11.7071 C10.9324385,11.3466385 10.9047107,10.7793793 11.2097166,10.3871027 L11.2929,10.2929 L13.5858,7.99999 L11.2929,5.7071 C10.9024,5.31657 10.9024,4.68341 11.2929,4.29288 Z"/>
                </svg>
              </CodeToggleButton>
              <IconButton
                isDark={isDarkMode}
                style={{ cursor: iframeUrl ? "pointer" : "not-allowed" }}
                onClick={iframeUrl ? refreshIframe : undefined}
                title="Refresh"
              >
                <RotateCcw size={16} />
              </IconButton>
              <DeviceGroup>
                <DeviceButton
                  active={selectedDevice === "mobile"}
                  isDark={isDarkMode}
                  disabled={
                    !iframeUrl ||
                    !iframeReady ||
                    isUpdateInProgress ||
                    !initCompleted
                  }
                  onClick={() => setSelectedDevice("mobile")}
                >
                  <PhoneIcon />
                </DeviceButton>
                <DeviceButton
                  active={selectedDevice === "tablet"}
                  isDark={isDarkMode}
                  disabled={
                    !iframeUrl ||
                    !iframeReady ||
                    isUpdateInProgress ||
                    !initCompleted
                  }
                  onClick={() => setSelectedDevice("tablet")}
                >
                  <TabletIcon />
                </DeviceButton>
                <DeviceButton
                  active={selectedDevice === "desktop"}
                  isDark={isDarkMode}
                  disabled={
                    !iframeUrl ||
                    !iframeReady ||
                    isUpdateInProgress ||
                    !initCompleted
                  }
                  onClick={() => setSelectedDevice("desktop")}
                >
                  <ComputerIcon />
                </DeviceButton>
              </DeviceGroup>
              <UrlInput isDark={isDarkMode} value={iframeUrl || ""} readOnly />
              <ExternalLinkButton
                href={iframeUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                isDark={isDarkMode}
                disabled={!iframeUrl}
                tabIndex={iframeUrl ? 0 : -1}
              >
                <ExternalLink size={16} />
              </ExternalLinkButton>
            </UrlBarContainer>
            <IframeArea>
              {viewMode === "code" ? (
                <CodeViewer files={codeFiles} isDark={isDarkMode} />
              ) : iframeError ? (
                <IframeErrorContainer>
                  <Heart size={64} />
                  <ErrorTitle isDark={isDarkMode} style={{ marginTop: "24px" }}>
                    Failed to load website
                  </ErrorTitle>
                  <ErrorText isDark={isDarkMode} style={{ marginTop: "12px", textAlign: "center" }}>
                    {iframeUrl} took too long to load or failed to respond.
                  </ErrorText>
                  <ErrorText isDark={isDarkMode} style={{ marginTop: "8px", textAlign: "center" }}>
                    This could be due to network issues or the website being
                    temporarily unavailable.
                  </ErrorText>
                </IframeErrorContainer>
              ) : !iframeUrl ? (
                <IframeOverlay>
                  <LoadingState />
                </IframeOverlay>
              ) : !iframeReady || isUpdateInProgress || !initCompleted ? (
                <>
                  <IframeResponsiveWrapper>
                    <WebsiteIframe
                      ref={iframeRef}
                      src={iframeUrl}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      allow="fullscreen"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      isResizing={isResizing}
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      style={{
                        visibility:
                          iframeReady && !isUpdateInProgress
                            ? "visible"
                            : "hidden",
                        width:
                          typeof DEVICE_SPECS[selectedDevice].width === "number"
                            ? `${DEVICE_SPECS[selectedDevice].width}px`
                            : DEVICE_SPECS[selectedDevice].width,
                        height:
                          typeof DEVICE_SPECS[selectedDevice].height ===
                          "number"
                            ? `${DEVICE_SPECS[selectedDevice].height}px`
                            : DEVICE_SPECS[selectedDevice].height,
                        margin:
                          selectedDevice === "desktop" ? "0" : "24px auto",
                        display: "block",
                        borderRadius: selectedDevice === "desktop" ? 0 : 16,
                        boxShadow:
                          selectedDevice === "desktop"
                            ? "none"
                            : "0 2px 16px rgba(0,0,0,0.12)",
                        background: "#fff",
                        boxSizing: "border-box",
                      }}
                    />
                  </IframeResponsiveWrapper>
                  <IframeOverlay>
                    {isUpdateInProgress || (!iframeReady && !initCompleted) ? (
                      <UpdateInProgressState />
                    ) : (
                      <LoadingState />
                    )}
                  </IframeOverlay>
                </>
              ) : (
                <IframeResponsiveWrapper>
                  <WebsiteIframe
                    ref={iframeRef}
                    src={iframeUrl}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    allow="fullscreen"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    isResizing={isResizing}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    style={{
                      visibility:
                        iframeReady && !isUpdateInProgress
                          ? "visible"
                          : "hidden",
                      width:
                        typeof DEVICE_SPECS[selectedDevice].width === "number"
                          ? `${DEVICE_SPECS[selectedDevice].width}px`
                          : DEVICE_SPECS[selectedDevice].width,
                      height:
                        typeof DEVICE_SPECS[selectedDevice].height === "number"
                          ? `${DEVICE_SPECS[selectedDevice].height}px`
                          : DEVICE_SPECS[selectedDevice].height,
                      margin: selectedDevice === "desktop" ? "0" : "24px auto",
                      display: "block",
                      borderRadius: selectedDevice === "desktop" ? 0 : 16,
                      boxShadow:
                        selectedDevice === "desktop"
                          ? "none"
                          : "0 2px 16px rgba(0,0,0,0.12)",
                      background: "#fff",
                      boxSizing: "border-box",
                    }}
                  />
                </IframeResponsiveWrapper>
              )}
            </IframeArea>
          </IframeContainer>
        ) : (
          <>
            
            <ConnectTitle
              isDark={isDarkMode}
              style={{ marginTop: "24px" }}
              className="text-muted-foreground"
            >
              Connect to start building
            </ConnectTitle>

            {error && (
              <ErrorMessage className="text-destructive">
                <ErrorText isDark={isDarkMode}>Error: {error}</ErrorText>
              </ErrorMessage>
            )}

            <Checklist>
              <ChecklistItem>
                <Play size={16} />
                <ChecklistText isDark={isDarkMode}>Connect to Workspace</ChecklistText>
              </ChecklistItem>
              <ChecklistItem>
                <Play size={16} />
                <ChecklistText isDark={isDarkMode}>Chat with AI in the sidebar</ChecklistText>
              </ChecklistItem>
              <ChecklistItem>
                <Play size={16} />
                <ChecklistText isDark={isDarkMode}>
                  Select specific elements to modify
                </ChecklistText>
              </ChecklistItem>
            </Checklist>
          </>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default Create;

const PageContainer = styled.div<{ isDark: boolean }>`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  background: ${props => props.isDark 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%)'
    : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #ffecd2 100%)'
  };
  position: relative;
  overflow: hidden;
  transition: background 0.5s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: ${props => props.isDark ? '0.3' : '0.2'};
    pointer-events: none;
  }
`;

const Sidebar = styled.div<{ isDark?: boolean }>`
  padding: 24px;
  display: flex;
  flex-direction: column;
  color: ${({ isDark }) => isDark ? 'white' : '#1a1a1a'};
  gap: 24px;
  background: ${({ isDark }) => 
    isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'
  };
  backdrop-filter: blur(20px);
  border-right: 1px solid ${({ isDark }) => 
    isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
  };
  position: relative;
  z-index: 2;
`;

const MainContent = styled.div<{ hasIframe: boolean; isDark: boolean }>`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: ${({ hasIframe }) => (hasIframe ? "stretch" : "center")};
  justify-content: ${({ hasIframe }) => (hasIframe ? "stretch" : "center")};
  gap: ${({ hasIframe }) => (hasIframe ? "0" : "24px")};
  position: relative;
  z-index: 1;
`;

const Checklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 48px;
`;

const ChecklistItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const BeamHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #7c3aed;
  border-radius: 8px;
  padding: 4px;
`;

const LogoText = styled.div<{ isDark?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ isDark }) => (isDark ? "white" : "#1a1a1a")};
  font-family: 'Montserrat', sans-serif;
`;

const ChatHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex-grow: 1;
  
  /* Hide scrollbar */
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: transparent;
  }
  
  /* Firefox */
  scrollbar-width: none;
  -ms-overflow-style: none;
`;

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
`;

const MessageBubble = styled.div<{ isUser: boolean; isDark?: boolean }>`
  padding: 12px;
  border-radius: 8px;
  max-width: 70%;
  background: ${({ isUser, isDark }) => 
    isUser 
      ? (isDark ? 'rgba(124, 58, 237, 0.8)' : 'rgba(124, 58, 237, 0.9)')
      : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)')
  };
  color: ${({ isUser, isDark }) => 
    isUser ? 'white' : (isDark ? 'white' : '#1a1a1a')
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${({ isUser, isDark }) => 
    isUser 
      ? (isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.4)')
      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)')
  };
`;

const ChatInputContainer = styled.div<{ isDark: boolean }>`
  margin-top: auto;
  position: relative;
  background: ${({ isDark }) => isDark 
    ? 'rgba(0, 0, 0, 0.3)' 
    : 'rgba(255, 255, 255, 0.3)'
  };
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid ${({ isDark }) => isDark 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(255, 255, 255, 0.4)'
  };
  transition: all 0.3s ease;
  box-shadow: ${({ isDark }) => isDark 
    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
    : '0 8px 32px rgba(0, 0, 0, 0.1)'
  };
`;

const StyledTextarea = styled(Textarea)<{ isDark: boolean }>`
  background: transparent;
  border: none;
  color: ${({ isDark }) => isDark ? 'white' : '#1a1a1a'};
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
  line-height: 1.6;
  padding: 0 60px 0 0;
  resize: none;
  min-height: 60px;
  max-height: 144px;
  overflow-y: auto;
  letter-spacing: -0.1px;
  width: 100%;
  
  &::placeholder {
    color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'};
    font-weight: 400;
  }
  
  &:focus {
    outline: none;
    box-shadow: none;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Hide scrollbar */
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: transparent;
  }
  
  /* Firefox */
  scrollbar-width: none;
  -ms-overflow-style: none;
`;

const ArrowButton = styled.button<{ isDark: boolean }>`
  position: absolute;
  right: 20px;
  bottom: 20px;
  background: ${({ isDark }) => isDark 
    ? 'rgba(255, 255, 255, 0.15)' 
    : 'rgba(255, 255, 255, 0.4)'
  };
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  
  &:hover:not(:disabled) {
    background: ${({ isDark }) => isDark 
      ? 'rgba(255, 255, 255, 0.25)' 
      : 'rgba(255, 255, 255, 0.5)'
    };
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ArrowIcon = styled.span<{ isDark: boolean }>`
  color: ${({ isDark }) => isDark ? 'white' : '#1a1a1a'};
  font-size: 18px;
  font-weight: bold;
  font-family: 'Montserrat', sans-serif;
`;

const ErrorMessage = styled.div`
  border: 1px solid #f87171;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  justify-content: flex-start;
`;

const TypingDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #9ca3af;
  animation: typing 1.4s infinite ease-in-out;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes typing {
    0%,
    80%,
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const ResizeHandle = styled.div`
  width: 4px;
  cursor: col-resize;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #9ca3af;
  }

  &:active {
    background-color: #3b82f6;
  }
`;

const IframeContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
`;

const IframeArea = styled.div`
  position: relative;
  width: 100%;
  height: calc(100% - 44px); /* subtract url bar height */
  min-height: 0;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
`;

const IframeResponsiveWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;

  & > iframe {
    max-width: 100%;
    max-height: 100%;
  }
`;

const WebsiteIframe = styled.iframe<{ isResizing: boolean }>`
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: ${({ isResizing }) => (isResizing ? "none" : "auto")};
  display: block;
  box-sizing: border-box;
`;

const IframeErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
`;

const IframeOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const SpinningIcon = styled.div`
  animation: spin 1s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const IconButton = styled.button<{ isDark?: boolean }>`
    background: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${({ disabled, isDark }) =>
    disabled 
      ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
      : (isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)')
  };
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  text-decoration: none;
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  
  &:hover:not([disabled]) {
    background: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
  }
`;

const ExternalLinkButton = styled.a<{ isDark?: boolean; disabled?: boolean }>`
  background: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${({ disabled, isDark }) =>
    disabled 
      ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
      : (isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)')
  };
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  text-decoration: none;
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  
  &:hover:not([disabled]) {
    background: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
  }
`;

const AnimatedText = styled.div<{ isDark?: boolean }>`
  font-size: 18px;
  font-weight: 500;
  color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a'};
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

const ErrorTitle = styled.div<{ isDark?: boolean }>`
  font-size: 18px;
  font-weight: 500;
  color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a'};
`;

const ErrorText = styled.div<{ isDark?: boolean }>`
  font-size: 14px;
  color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.7)' : '#1a1a1a'};
`;

const ConnectTitle = styled.div<{ isDark?: boolean }>`
  font-size: 18px;
  font-weight: 500;
  color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a'};
`;

const ChecklistText = styled.div<{ isDark?: boolean }>`
  font-size: 14px;
  color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.7)' : '#1a1a1a'};
`;

const UrlBarContainer = styled.div<{ isDark: boolean }>`
  display: flex;
  align-items: center;
  background: ${({ isDark }) => isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
  border-bottom: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'};
  padding: 6px 12px;
  gap: 8px;
  backdrop-filter: blur(20px);
`;

const UrlInput = styled.input<{ isDark: boolean }>`
  flex: 1;
  background: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  color: ${({ isDark }) => isDark ? 'white' : '#1a1a1a'};
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  outline: none;
  
  &::placeholder {
    color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'};
  }
`;

const BottomBar = styled.div<{ isDark: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ isDark }) => isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
  border-top: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'};
  padding: 0 24px;
  height: 43px;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  backdrop-filter: blur(20px);
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const CodeToggleButton = styled.button<{ isDark?: boolean }>`
  background: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${({ disabled, isDark }) =>
    disabled 
      ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
      : (isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)')
  };
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
  }
  
  svg {
    transition: all 0.15s ease;
  }
`;

const DeviceGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const DeviceButton = styled.button<{ active?: boolean; isDark?: boolean }>`
  background: ${({ active, isDark }) => 
    active 
      ? (isDark ? '#7c3aed' : '#7c3aed')
      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
  };
  color: ${({ active, disabled, isDark }) =>
    disabled 
      ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
      : active 
        ? 'white'
        : (isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)')
  };
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: ${({ active, isDark }) => 
      active 
        ? '#6d28d9'
        : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)')
    };
  }
`;

const DeployButton = styled.button<{ isDark?: boolean }>`
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 28px;
  font-size: 15px;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  
  &:hover:not(:disabled) {
    background: #6d28d9;
    transform: translateY(-1px);
  }
`;
