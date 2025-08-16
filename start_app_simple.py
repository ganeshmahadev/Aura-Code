#!/usr/bin/env python3
"""
Simple Dynamic Lovable Clone Startup
===================================

This script provides a guided startup process that:
1. Helps you start services manually but automates URL management
2. Extracts URLs and updates configurations automatically
3. Provides clear step-by-step instructions

Usage: python3 start_app_simple.py
"""

import subprocess
import re
import time
import os
import sys
from pathlib import Path

def log(message, level="info"):
    """Print formatted log message"""
    icons = {"info": "ℹ️", "success": "✅", "error": "❌", "step": "🔄", "wait": "⏳"}
    print(f"{icons.get(level, 'ℹ️')} {message}")

def input_with_prompt(prompt):
    """Get user input with colored prompt"""
    return input(f"🔍 {prompt}")

def update_agent_file(mcp_url):
    """Update agent.py with the MCP URL"""
    agent_file = Path("src/agent.py")
    if not agent_file.exists():
        log("src/agent.py not found", "error")
        return False
    
    # Read current content
    content = agent_file.read_text()
    
    # Update the fallback URL in the _load_agent function
    pattern = r'agent = Agent\(mcp_url=os\.getenv\("LOVABLE_MCP_URL", "[^"]*"\)\)'
    replacement = f'agent = Agent(mcp_url=os.getenv("LOVABLE_MCP_URL", "{mcp_url}"))'
    
    updated_content = re.sub(pattern, replacement, content)
    
    if updated_content == content:
        log("Could not find the MCP URL pattern in agent.py", "error")
        return False
    
    # Write updated content
    agent_file.write_text(updated_content)
    log(f"Updated agent.py with MCP URL: {mcp_url}", "success")
    return True

def update_frontend_env(ws_url):
    """Update frontend .env file with WebSocket URL"""
    env_file = Path("frontend/.env")
    
    # Read current .env content or create from template
    if env_file.exists():
        content = env_file.read_text()
    else:
        template_file = Path("frontend/.env.template")
        if template_file.exists():
            content = template_file.read_text()
        else:
            content = "VITE_BEAM_WS_URL=\nVITE_BEAM_TOKEN=\n"
    
    # Update WebSocket URL
    content = re.sub(r'VITE_BEAM_WS_URL=.*', f'VITE_BEAM_WS_URL={ws_url}', content)
    
    # Ensure Beam token is present
    if 'VITE_BEAM_TOKEN=' not in content or 'VITE_BEAM_TOKEN=your-beam-token' in content:
        beam_token = 'RXIikfUgLJpEqLpA2t3CSOzoV058gII4jxJzbZqWxExLXb7PQsmqUnKWf6Vti4Qmha9LQF4yS-dGAfJQQbZY1Q=='
        content = re.sub(r'VITE_BEAM_TOKEN=.*', f'VITE_BEAM_TOKEN={beam_token}', content)
    
    # Write updated content
    env_file.write_text(content)
    log(f"Updated frontend .env with WebSocket URL: {ws_url}", "success")
    return True

def update_beam_secret(mcp_url):
    """Update Beam secret with MCP URL"""
    try:
        # Delete existing secret (ignore if doesn't exist)
        subprocess.run(["beam", "secret", "delete", "LOVABLE_MCP_URL"], 
                     capture_output=True, check=False)
        
        # Create new secret
        result = subprocess.run(
            ["beam", "secret", "create", "LOVABLE_MCP_URL", mcp_url],
            capture_output=True, text=True, check=True
        )
        log(f"Updated LOVABLE_MCP_URL secret: {mcp_url}", "success")
        return True
        
    except subprocess.CalledProcessError as e:
        log(f"Failed to update secrets: {e.stderr}", "error")
        return False

def main():
    print("🚀 Lovable Clone Dynamic Startup Helper")
    print("=" * 50)
    print()
    
    # Step 1: Start MCP Server
    print("📋 STEP 1: Start MCP Server")
    print("Run this command in a new terminal:")
    print("  beam serve src/tools.py:s")
    print()
    
    mcp_url = input_with_prompt("Paste the MCP server URL (the https://... URL from the output): ").strip()
    
    if not mcp_url.startswith('https://'):
        log("Invalid URL format", "error")
        return
    
    # Add /sse if not present
    if not mcp_url.endswith('/sse'):
        mcp_url += '/sse'
    
    # Update configurations
    log("Updating configurations...", "step")
    update_beam_secret(mcp_url)
    update_agent_file(mcp_url)
    
    print()
    
    # Step 2: Start Agent
    print("📋 STEP 2: Start Agent Service")
    print("Run this command in another new terminal:")
    print("  beam serve src/agent.py:handler")
    print()
    
    ws_url = input_with_prompt("Paste the agent WebSocket URL (the wss://... URL): ").strip()
    
    if not ws_url.startswith('wss://'):
        log("Invalid WebSocket URL format", "error")
        return
    
    # Update frontend environment
    update_frontend_env(ws_url)
    
    print()
    
    # Step 3: Start Frontend
    print("📋 STEP 3: Start Frontend")
    print("Run this command in another terminal:")
    print("  cd frontend && npm run dev")
    print()
    
    print("🎉 Configuration Complete!")
    print("=" * 30)
    print(f"🔧 MCP Server:    {mcp_url}")
    print(f"🤖 Agent Service: {ws_url}")
    print(f"🌐 Frontend:      http://localhost:5173/")
    print("=" * 30)
    print()
    print("💡 All URLs have been automatically configured!")
    print("   Open http://localhost:5173/ in your browser when frontend starts.")

if __name__ == "__main__":
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        log(f"Unexpected error: {e}", "error")