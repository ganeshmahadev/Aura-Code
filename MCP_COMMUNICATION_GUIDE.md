# MCP (Model Context Protocol) Communication Guide
## How AI Agents and MCP Server Communicate in AuraCode

### Overview
The MCP (Model Context Protocol) is the bridge between our frontend application and the AI agents that generate code. It provides a standardized way for AI agents to interact with development tools and environments.

## Communication Flow Diagram

```
┌─────────────┐    WebSocket     ┌──────────────┐    MCP Protocol    ┌─────────────┐
│   Frontend  │ ◄─────────────► │  Beam Cloud  │ ◄─────────────────► │ MCP Server  │
│   (React)   │                 │  (Platform)  │                    │ (AI Agents) │
└─────────────┘                 └──────────────┘                    └─────────────┘
       │                               │                                    │
       │                               │                                    ▼
       │                               ▼                           ┌─────────────┐
       │                    ┌──────────────┐                      │   AI Agent  │
       │                    │   Sandbox    │ ◄────────────────────│ (Claude/GPT) │
       │                    │ Environment  │   Tool Execution     │             │
       │                    │             │                      │ Available   │
       ▼                    │ - Files     │                      │ Tools:      │
┌─────────────┐            │ - Commands  │                      │ • File Ops  │
│  Supabase   │            │ - Server    │                      │ • Commands  │
│ (Database)  │            └──────────────┘                      │ • Analysis  │
│             │                     │                           └─────────────┘
│ Sessions ◄──┼─────────────────────┘
│ Messages    │          Live Preview URL
└─────────────┘
```

## Message Types and Flow

### 1. Session Initialization
```typescript
// User starts a new project or opens existing one
Frontend → WebSocket: {
  type: "INIT",
  data: {
    sessionId?: "uuid-123",
    initialPrompt?: "Create a todo app"
  }
}

// MCP Server creates/restores sandbox environment
MCP Server → AI Agent:
- create_sandbox() if new session
- restore_sandbox(sandbox_id) if existing session

// Response with sandbox details
WebSocket → Frontend: {
  type: "INIT", 
  data: {
    url: "https://sandbox-123.beam.cloud",
    sandbox_id: "sb_123",
    status: "ready"
  }
}
```

### 2. User Request Processing
```typescript
// User sends development request
Frontend → WebSocket: {
  type: "USER",
  data: {
    text: "Add dark mode support to the application",
    sessionId: "uuid-123"
  }
}

// AI Agent receives request and plans approach
AI Agent Planning:
1. Analyze current codebase structure
2. Identify files that need modification
3. Plan implementation strategy
4. Execute step-by-step development
```

### 3. AI Agent Tool Execution
```typescript
// AI Agent uses MCP tools to implement features
MCP Tool Calls:

1. read_file("src/App.tsx") 
   → Get current application structure

2. create_file("src/contexts/ThemeContext.tsx")
   → Create theme management context

3. edit_file("src/App.tsx", {
     changes: [
       {
         type: "import",
         content: "import { ThemeProvider } from './contexts/ThemeContext';"
       },
       {
         type: "wrap",
         content: "<ThemeProvider>{children}</ThemeProvider>"
       }
     ]
   })

4. run_command("npm install react-use-theme")
   → Install required dependencies

5. start_dev_server()
   → Restart development server with changes
```

### 4. Real-time Updates to Frontend
```typescript
// AI Agent streams progress updates
WebSocket → Frontend: {
  type: "AGENT_PARTIAL",
  data: {
    text: "I'm creating a theme context to manage dark mode...",
    isStreaming: true
  }
}

WebSocket → Frontend: {
  type: "UPDATE_IN_PROGRESS", 
  data: {
    message: "Installing dependencies..."
  }
}

WebSocket → Frontend: {
  type: "FILE_UPDATED",
  data: {
    path: "src/contexts/ThemeContext.tsx",
    action: "created"
  }
}

WebSocket → Frontend: {
  type: "UPDATE_COMPLETED",
  data: {
    url: "https://sandbox-123.beam.cloud", // Updated preview URL
    files: {
      "src/App.tsx": "updated content...",
      "src/contexts/ThemeContext.tsx": "new file content..."
    }
  }
}
```

## Available MCP Tools for AI Agents

### 1. File System Operations
```typescript
interface FileSystemTools {
  create_file(path: string, content: string): Promise<void>;
  read_file(path: string): Promise<string>;
  edit_file(path: string, changes: FileChange[]): Promise<void>;
  delete_file(path: string): Promise<void>;
  list_files(directory?: string): Promise<string[]>;
  move_file(oldPath: string, newPath: string): Promise<void>;
}

// Example usage:
await create_file("src/components/TodoItem.tsx", `
import React from 'react';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ 
  id, text, completed, onToggle 
}) => {
  return (
    <div className="todo-item">
      <input 
        type="checkbox" 
        checked={completed}
        onChange={() => onToggle(id)}
      />
      <span className={completed ? 'completed' : ''}>{text}</span>
    </div>
  );
};
`);
```

### 2. Command Execution
```typescript
interface CommandTools {
  run_command(command: string, workdir?: string): Promise<CommandResult>;
  install_dependencies(packageManager?: 'npm' | 'yarn'): Promise<void>;
  start_dev_server(): Promise<ServerInfo>;
  build_project(): Promise<BuildResult>;
  run_tests(): Promise<TestResult>;
}

// Example usage:
await run_command("npm install @types/react");
await run_command("npx tailwindcss init");
const serverInfo = await start_dev_server();
// Returns: { url: "http://localhost:3000", pid: 12345 }
```

### 3. Code Analysis
```typescript
interface AnalysisTools {
  analyze_code_structure(): Promise<CodeStructure>;
  find_errors(): Promise<Error[]>;
  suggest_improvements(): Promise<Suggestion[]>;
  get_dependencies(): Promise<Dependency[]>;
  check_security_issues(): Promise<SecurityIssue[]>;
}

// Example usage:
const structure = await analyze_code_structure();
/*
Returns:
{
  components: ["App", "TodoList", "TodoItem"],
  hooks: ["useLocalStorage", "useTodos"],
  contexts: ["ThemeContext"],
  pages: ["Home", "About"],
  dependencies: ["react", "typescript", "styled-components"]
}
*/
```

### 4. Environment Management
```typescript
interface EnvironmentTools {
  create_sandbox(): Promise<SandboxInfo>;
  destroy_sandbox(sandboxId: string): Promise<void>;
  get_sandbox_status(sandboxId: string): Promise<SandboxStatus>;
  deploy_to_preview(): Promise<DeploymentInfo>;
  get_live_url(): Promise<string>;
}

// Example usage:
const sandbox = await create_sandbox();
const liveUrl = await get_live_url();
// Returns: "https://amazing-app-abc123.preview.beam.cloud"
```

## Error Handling and Recovery

### 1. Connection Errors
```typescript
// Frontend handles WebSocket disconnections
WebSocket.onclose = (event) => {
  if (event.code !== 1000) {
    // Unexpected disconnection - attempt reconnect
    scheduleReconnection();
  }
};

// AI Agent handles tool execution errors
try {
  await run_command("npm install invalid-package");
} catch (error) {
  // Send error message to frontend
  sendMessage({
    type: "ERROR",
    data: {
      message: "Failed to install package: invalid-package not found",
      recovery: "Please check the package name and try again"
    }
  });
}
```

### 2. Sandbox Recovery
```typescript
// If sandbox becomes unresponsive
if (await get_sandbox_status(sandboxId) === "unresponsive") {
  // Create new sandbox
  const newSandbox = await create_sandbox();
  
  // Restore files from previous state
  await restore_files_from_session(sessionId);
  
  // Notify frontend of new sandbox
  sendMessage({
    type: "INIT",
    data: {
      url: newSandbox.url,
      sandbox_id: newSandbox.id,
      status: "recovered"
    }
  });
}
```

## Performance Optimizations

### 1. Message Batching
```typescript
// AI Agent batches multiple file operations
const fileOperations = [
  { type: "create", path: "src/utils/helpers.ts", content: "..." },
  { type: "edit", path: "src/App.tsx", changes: [...] },
  { type: "create", path: "src/styles/globals.css", content: "..." }
];

// Send single batched update
sendMessage({
  type: "BATCH_UPDATE",
  data: {
    operations: fileOperations,
    message: "Setting up project structure..."
  }
});
```

### 2. Streaming Responses
```typescript
// AI Agent streams long responses
for (const chunk of generateResponse(userRequest)) {
  sendMessage({
    type: "AGENT_PARTIAL",
    data: {
      text: chunk,
      isStreaming: true,
      messageId: "msg_123"
    }
  });
}

// Final message to indicate completion
sendMessage({
  type: "AGENT_PARTIAL", 
  data: {
    text: "",
    isStreaming: false,
    messageId: "msg_123"
  }
});
```

This MCP communication system enables AuraCode to provide seamless, real-time AI-powered development experiences while maintaining security, performance, and reliability.