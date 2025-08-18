# AuraCode - Technical Architecture Documentation

## Project Overview
AuraCode is an AI-powered web development platform that enables users to build full-stack applications through natural language conversations with AI agents. The platform provides real-time code generation, live preview, and persistent development sessions.

## System Architecture

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────┐
│                        AuraCode Platform                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                          │                           │
        ▼                          ▼                           ▼
┌──────────────┐          ┌──────────────┐           ┌──────────────┐
│   Frontend   │          │  Beam Cloud  │           │   Supabase   │
│              │          │              │           │              │
│ React + TS   │◄────────►│ WebSocket    │           │ Auth + DB    │
│ Styled Comp  │          │ MCP Server   │           │ RLS Policies │
│ Real-time UI │          │ AI Agents    │           │ Session Data │
└──────────────┘          │ Sandboxes    │           └──────────────┘
                          └──────────────┘
```

### Component Architecture

#### 1. Frontend Architecture (React + TypeScript)
```
src/
├── components/           # Reusable UI components
│   ├── Header.tsx       # Navigation and user menu
│   ├── SessionCard.tsx  # Project card in workspace
│   └── SessionsGrid.tsx # Project workspace grid
│
├── screens/             # Main application screens
│   ├── Auth/           # Authentication screens
│   ├── Create/         # Main development environment
│   └── New/            # Landing page
│
├── hooks/              # Custom React hooks
│   └── useMessageBus.ts # WebSocket communication
│
├── lib/                # Business logic and utilities
│   ├── sessions.ts     # Database operations
│   └── supabase.ts     # Database client and types
│
├── services/           # External service integrations
│   ├── messageBus.ts   # Message routing and handling
│   └── websocketBus.ts # WebSocket connection management
│
├── styles/             # Design system and styling
│   ├── components/     # Styled components library
│   └── theme.ts        # Design tokens and theme
│
├── contexts/           # React context providers
│   └── AuthContext.tsx # Authentication state management
│
└── types/              # TypeScript type definitions
    └── messages.ts     # Message protocol types
```

## Core Communication Protocols

### 1. WebSocket Message Protocol
```typescript
interface Message {
  id?: string;
  type: MessageType;
  timestamp: number;
  data: {
    text?: string;
    sender?: Sender;
    url?: string;
    sandbox_id?: string;
    files?: Record<string, string>;
    error?: string;
    [key: string]: any;
  };
}

enum MessageType {
  // User interactions
  USER = 'user',
  
  // AI responses  
  ASSISTANT = 'assistant',
  AGENT_PARTIAL = 'agent_partial',
  
  // System messages
  INIT = 'init',
  ERROR = 'error',
  
  // Development workflow
  UPDATE_IN_PROGRESS = 'update_in_progress',
  UPDATE_COMPLETED = 'update_completed',
  
  // File operations
  FILE_UPDATED = 'file_updated',
  CODE_FILES = 'code_files',
  
  // Health checks
  PING = 'ping'
}
```

### 2. MCP (Model Context Protocol) Integration
```
User Request → Frontend → WebSocket → Beam Cloud → MCP Server → AI Agent

AI Agent has access to these MCP tools:
├── File System Tools
│   ├── create_file(path, content)
│   ├── edit_file(path, changes)
│   ├── delete_file(path)
│   └── read_file(path)
│
├── Command Execution
│   ├── run_command(command)
│   ├── install_dependencies()
│   └── start_dev_server()
│
├── Environment Management
│   ├── create_sandbox()
│   ├── deploy_app()
│   └── get_sandbox_url()
│
└── Code Analysis
    ├── analyze_code_structure()
    ├── find_errors()
    └── suggest_improvements()
```

## Database Schema (Supabase)

### 1. Sessions Table
```sql
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sandbox_id TEXT,          -- Beam Cloud sandbox identifier
    thumbnail TEXT,           -- Project preview image
    iframe_url TEXT,          -- Live app URL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_updated_at ON public.sessions(updated_at DESC);
```

### 2. Chat Messages Table
```sql
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,       -- MessageType enum value
    content TEXT NOT NULL,    -- Message text content
    sender TEXT NOT NULL,     -- USER or ASSISTANT
    timestamp TIMESTAMPTZ NOT NULL,
    message_data JSONB DEFAULT '{}', -- Additional message metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp);
```

### 3. Row Level Security Policies
```sql
-- Sessions RLS Policy
CREATE POLICY "Users can only access their own sessions" ON public.sessions
FOR ALL USING (user_id = auth.uid());

-- Chat Messages RLS Policy  
CREATE POLICY "Users can only access their own chat messages" ON public.chat_messages
FOR ALL USING (
    session_id IN (
        SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
);
```

## Key Features Implementation

### 1. Real-time AI Communication
**File**: `src/hooks/useMessageBus.ts`
```typescript
export const useMessageBus = ({
  wsUrl,
  token,
  handlers,
  onConnect,
  onDisconnect,
  onError
}) => {
  // Connection management with auto-reconnection
  // Message serialization/deserialization
  // Error handling and recovery
  // Clean disconnect on unmount
};
```

**Key Features**:
- Automatic reconnection with exponential backoff
- Message queuing when disconnected
- Type-safe message handling
- Connection state management

### 2. Session Management
**File**: `src/lib/sessions.ts`
```typescript
// Core session operations
export const createSession = async (title, description) => { /* ... */ };
export const updateSession = async (sessionId, updates) => { /* ... */ };
export const getUserSessions = async () => { /* ... */ };
export const deleteSession = async (sessionId) => { /* ... */ };

// Chat message operations
export const saveMessage = async (sessionId, message) => { /* ... */ };
export const getSessionMessages = async (sessionId) => { /* ... */ };

// Utility functions
export const removeDuplicateSessions = async () => { /* ... */ };
```

**Key Features**:
- Duplicate prevention
- Atomic operations
- Comprehensive error handling
- Message persistence with session linking

### 3. Development Environment
**File**: `src/screens/Create/index.tsx`

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────────┐
│                          Header                                  │
├─────────────────────┬───────────────────────────────────────────┤
│                     │                                           │
│    Chat Panel       │           Preview Panel                   │
│    (Resizable)      │                                           │
│                     │  ┌─────────────────────────────────────┐  │
│ ┌─────────────────┐ │  │        Device Controls              │  │
│ │  Chat History   │ │  ├─────────────────────────────────────┤  │
│ │                 │ │  │                                     │  │
│ │  User: "Build   │ │  │        Live Preview                 │  │
│ │  a todo app"    │ │  │        (iframe)                     │  │
│ │                 │ │  │                                     │  │
│ │  AI: "I'll      │ │  │     OR                              │  │
│ │  create..."     │ │  │                                     │  │
│ │                 │ │  │        Code View                    │  │
│ │  [Messages...]  │ │  │        (syntax highlighted)        │  │
│ └─────────────────┘ │  │                                     │  │
│                     │  └─────────────────────────────────────┘  │
│ ┌─────────────────┐ │                                           │
│ │   Input Box     │ │                                           │
│ └─────────────────┘ │                                           │
└─────────────────────┴───────────────────────────────────────────┘
```

**State Management**:
```typescript
// UI State
const [sidebarWidth, setSidebarWidth] = useState(400);
const [selectedDevice, setSelectedDevice] = useState('desktop');
const [viewMode, setViewMode] = useState('preview');

// Communication State
const [messages, setMessages] = useState<Message[]>([]);
const [isConnected, setIsConnected] = useState(false);

// Session State
const [currentSession, setCurrentSession] = useState<Session | null>(null);
const [iframeUrl, setIframeUrl] = useState('');
const [sandboxId, setSandboxId] = useState('');
```

### 4. Design System
**File**: `src/styles/components/`

**Theme Architecture**:
```typescript
export const theme = {
  colors: {
    primary: '#7c3aed',
    backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #7209b7 100%)',
    text: {
      primary: 'white',
      secondary: 'rgba(255, 255, 255, 0.9)',
      muted: 'rgba(255, 255, 255, 0.7)'
    }
  },
  typography: {
    fontFamily: {
      primary: "'Montserrat', sans-serif"
    },
    fontSize: { /* ... */ },
    fontWeight: { /* ... */ }
  },
  spacing: { /* ... */ },
  borderRadius: { /* ... */ },
  shadows: { /* ... */ },
  transitions: { /* ... */ }
};
```

**Component Library**:
- Atomic design principles
- Consistent prop interfaces
- Theme-aware styling
- Responsive design patterns

## Security Implementation

### 1. Authentication Flow
```
1. User Registration/Login → Supabase Auth
2. JWT Token Generation → Secure session management
3. Row Level Security → Database access control
4. WebSocket Authentication → Token-based connection
5. Sandbox Isolation → Secure code execution
```

### 2. Data Protection
- **Row Level Security (RLS)** on all database tables
- **JWT token validation** for WebSocket connections
- **Sandbox environment isolation** for code execution
- **Input sanitization** and validation
- **HTTPS/WSS encryption** for all communications

### 3. User Access Control
```sql
-- Users can only access their own data
POLICY "user_access_control" ON table_name
FOR ALL USING (user_id = auth.uid());
```

## Performance Optimizations

### 1. Frontend Performance
- **Code splitting** with React.lazy()
- **Memoization** with React.memo() and useMemo()
- **Virtual scrolling** for long chat histories
- **Debounced inputs** to reduce API calls
- **Optimistic UI updates** for better UX

### 2. Database Performance
- **Strategic indexing** on frequently queried columns
- **Query optimization** with proper joins and filters
- **Connection pooling** through Supabase
- **Pagination** for large data sets

### 3. WebSocket Optimization
- **Message batching** to reduce network overhead
- **Compression** for large payloads
- **Connection reuse** and management
- **Automatic cleanup** of idle connections

## Deployment Architecture

### 1. Frontend Deployment (Vercel/Netlify)
```
Build Process:
1. TypeScript compilation
2. Bundle optimization with Vite
3. Static asset generation
4. CDN deployment
5. Environment variable injection
```

### 2. Backend Services (Beam Cloud)
```
Beam Cloud Services:
├── WebSocket Server
│   ├── Message routing
│   ├── Connection management
│   └── Load balancing
│
├── MCP Server  
│   ├── AI agent management
│   ├── Tool execution
│   └── Sandbox orchestration
│
└── Sandbox Environment
    ├── Isolated file system
    ├── Node.js runtime
    ├── Package management
    └── Live preview serving
```

### 3. Database (Supabase)
```
Production Configuration:
├── Connection pooling (100 connections)
├── Read replicas for scaling
├── Automated backups
├── SSL/TLS encryption
└── Monitoring and alerts
```

## Monitoring and Observability

### 1. Error Tracking
- **Frontend errors**: Sentry integration
- **WebSocket errors**: Custom error boundaries
- **Database errors**: Supabase dashboard
- **AI agent errors**: Beam Cloud logs

### 2. Performance Monitoring
- **Core Web Vitals** tracking
- **WebSocket connection** health
- **Database query** performance
- **AI response times** measurement

### 3. User Analytics
- **Session duration** and engagement
- **Feature usage** patterns
- **Error rates** and recovery
- **Conversion funnel** analysis

This architecture enables AuraCode to provide a scalable, secure, and performant AI-powered development experience while maintaining code quality and user experience standards.