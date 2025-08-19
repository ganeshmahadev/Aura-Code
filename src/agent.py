import json
import os
import time
import uuid
from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mcp.types import CallToolResult, Tool


from beam import Image, PythonVersion, realtime

from baml_client.sync_client import BamlSyncClient, b
from baml_client.types import Message as ConvoMessage

from .client import mcp_session


class MessageType(Enum):
    INIT = "init"
    USER = "user"
    AGENT_PARTIAL = "agent_partial"
    AGENT_FINAL = "agent_final"
    LOAD_CODE = "load_code"
    EDIT_CODE = "edit_code"
    GET_CODE_FOR_DISPLAY = "get_code_for_display"
    CODE_DISPLAY_RESPONSE = "code_display_response"
    UPDATE_IN_PROGRESS = "update_in_progress"
    UPDATE_FILE = "update_file"
    UPDATE_COMPLETED = "update_completed"


@dataclass
class Message:
    id: str
    timestamp: int
    type: MessageType
    data: dict

    @classmethod
    def new(cls, type: MessageType, data: dict, id: str | None = None) -> "Message":
        return cls(
            type=type,
            data=data,
            id=id or str(uuid.uuid4()),
            timestamp=time.time_ns() // 1_000_000,
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "data": self.data,
            "timestamp": self.timestamp,
        }


class ToolType(Enum):
    CREATE_APP_ENVIRONMENT = "create_app_environment"
    LOAD_CODE = "load_code"
    EDIT_CODE = "edit_code"
    GET_CODE_FOR_DISPLAY = "get_code_for_display"


class Agent:
    """
    CORE AI AGENT CLASS - Orchestrates AI-powered development workflow
    
    This class bridges three key components:
    1. BAML Client - Handles RPC-like communication with OpenAI LLMs
    2. MCP Tools - Provides sandbox file operations and environment management  
    3. Frontend Communication - Streams real-time responses via WebSocket
    
    COMMUNICATION FLOW:
    Frontend → Agent → BAML Client (OpenAI) → Code Generation
                  ↓
    Agent → MCP Tools → Sandbox Operations (files, commands)
                  ↓  
    Agent → Frontend → Live Preview Updates
    """
    def __init__(self, *, mcp_url: str):
        # BAML Client: Handles OpenAI API communication with structured prompts/responses
        # Uses RPC-style function calls to generate code based on user feedback
        self.model_client: BamlSyncClient = b
        
        # MCP Server URL: Endpoint for Model Context Protocol tools
        # Provides sandbox file operations, command execution, environment management
        self.mcp_url: str = mcp_url
        
        # Available MCP tools loaded dynamically from the MCP server
        self.tools: list[Tool] = []
        
        # Sandbox initialization data (sandbox_id, preview_url, etc.)
        self.init_data: dict = {}
        
        # Conversation history maintained for context in multi-turn interactions
        self.history: list[dict] = []
        
    #MCP tool calls
    async def init(self):
        await self.load_tools()
        await self.create_app_environment()

    async def load_tools(self):
        async with mcp_session(self.mcp_url) as session:
            self.tools = await session.list_tools()

    async def create_app_environment(self):
        async with mcp_session(self.mcp_url) as session:
            response: CallToolResult = await session.call_tool(
                name=ToolType.CREATE_APP_ENVIRONMENT.value,
                arguments={},
            )
            self.init_data = json.loads(response.content[0].text)

    async def load_code(self, sandbox_id: str):
        async with mcp_session(self.mcp_url) as session:
            response: CallToolResult = await session.call_tool(
                name=ToolType.LOAD_CODE.value,
                arguments={"sandbox_id": sandbox_id},
            )
            return json.loads(response.content[0].text)

    async def edit_code(self, sandbox_id: str, code_map: dict):
        async with mcp_session(self.mcp_url) as session:
            response: CallToolResult = await session.call_tool(
                name=ToolType.EDIT_CODE.value,
                arguments={
                    "sandbox_id": sandbox_id,
                    "code_map": code_map,
                },
            )
            return json.loads(response.content[0].text)

    async def get_code_for_display(self, sandbox_id: str):
        async with mcp_session(self.mcp_url) as session:
            response: CallToolResult = await session.call_tool(
                name=ToolType.GET_CODE_FOR_DISPLAY.value,
                arguments={"sandbox_id": sandbox_id},
            )
            return json.loads(response.content[0].text)

    async def add_to_history(self, user_feedback: str, agent_plan: str):
        self.history.append(
            {
                "role": "user",
                "content": user_feedback,
            }
        )

        self.history.append(
            {
                "role": "assistant",
                "content": agent_plan,
            }
        )

    def get_history(self):
        return [
            ConvoMessage(role=msg["role"], content=msg["content"])
            for msg in self.history
        ]

    async def send_feedback(self, feedback: str):
        """
        MAIN AI WORKFLOW ORCHESTRATOR - Processes user requests end-to-end
        
        STEP-BY-STEP COMMUNICATION FLOW:
        1. Frontend sends user feedback via WebSocket
        2. Agent loads current sandbox code via MCP tools
        3. Agent calls BAML Client with structured prompt (RPC-like)
        4. BAML Client streams OpenAI responses back to Agent
        5. Agent applies code changes via MCP tools
        6. Agent sends real-time updates to Frontend via WebSocket
        """
        
        # Step 1: Notify frontend that AI is processing the request
        yield Message.new(MessageType.UPDATE_IN_PROGRESS, {}).to_dict()

        # Step 2: Load current codebase from sandbox via MCP tools
        # This ensures AI has complete context of existing code
        code_map, package_json = await self.load_code(self.init_data["sandbox_id"])

        # Step 3: Format code files for BAML Client consumption
        code_files = []
        for path, content in code_map.items():
            code_files.append({"path": path, "content": content})

        # Step 4: Get conversation history for multi-turn context
        history = self.get_history()
        
        # Step 5: BAML CLIENT RPC CALL - This is where AI magic happens!
        # BAML provides RPC-like interface to OpenAI, handling:
        # - Structured prompt templating with conversation history
        # - Type-safe request/response with streaming
        # - Automatic retry logic and error handling
        stream = self.model_client.stream.EditCode(
            history, feedback, code_files, package_json
        )
        sent_plan = False

        new_code_map = {}
        plan_msg_id = str(uuid.uuid4())
        file_msg_id = str(uuid.uuid4())

        # Step 6: Process streamed AI responses in real-time
        for partial in stream:
            # Stream AI's planning/explanation to frontend
            if partial.plan.state != "Complete" and not sent_plan:
                yield Message.new(
                    MessageType.AGENT_PARTIAL,
                    {"text": partial.plan.value},
                    id=plan_msg_id,
                ).to_dict()

            # Send final AI plan when complete
            if partial.plan.state == "Complete" and not sent_plan:
                yield Message.new(
                    MessageType.AGENT_FINAL,
                    {"text": partial.plan.value},
                    id=plan_msg_id,
                ).to_dict()

                # Add to conversation history for future context
                await self.add_to_history(feedback, partial.plan.value)
                sent_plan = True

            # Process generated code files
            for file in partial.files:
                if file.path not in new_code_map:
                    # Notify frontend about file being worked on
                    yield Message.new(
                        MessageType.UPDATE_FILE,
                        {"text": f"Working on {file.path}"},
                        id=file_msg_id,
                    ).to_dict()

                    new_code_map[file.path] = file.content

        # Step 7: Apply all code changes to sandbox via MCP tools
        # This triggers the dev server restart and live preview update
        await self.edit_code(self.init_data["sandbox_id"], new_code_map)

        # Step 8: Notify frontend that all updates are complete
        yield Message.new(MessageType.UPDATE_COMPLETED, {}).to_dict()


async def _load_agent():
    agent = Agent(mcp_url=os.getenv("LOVABLE_MCP_URL", "https://lovable-mcp-server-6b17ffd-v1.app.beam.cloud/sse"))
    print("Loaded agent")
    return agent


@realtime(
    cpu=1.0,
    memory=1024,
    on_start=_load_agent,
    image=Image(
        python_packages="requirements.txt", python_version=PythonVersion.Python312
    ),
    secrets=["OPENAI_API_KEY", "LOVABLE_MCP_URL"],
    concurrent_requests=1000,
    keep_warm_seconds=300,
)
async def handler(event, context):
    agent: Agent = context.on_start_value
    msg = json.loads(event)

    match msg.get("type"):
        case MessageType.USER.value:
            return agent.send_feedback(msg["data"]["text"])
        case MessageType.INIT.value:
            await agent.init()
            return Message.new(MessageType.INIT, agent.init_data).to_dict()
        case MessageType.LOAD_CODE.value:
            code_map = await agent.load_code(msg["data"]["sandbox_id"])
            return Message.new(MessageType.LOAD_CODE, code_map).to_dict()
        case MessageType.GET_CODE_FOR_DISPLAY.value:
            code_data = await agent.get_code_for_display(msg["data"]["sandbox_id"])
            return Message.new(MessageType.CODE_DISPLAY_RESPONSE, code_data).to_dict()
        case _:
            return {}
