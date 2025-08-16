#!/bin/bash

# Automatic Lovable Clone Startup
# ===============================
# This script automatically starts all services and extracts URLs

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
log_step() { echo -e "\n${YELLOW}🔄 Step $1: $2${NC}"; }

echo -e "${BLUE}🚀 Starting Lovable Clone with automatic URL detection...${NC}"

# Check if we're in the right directory
if [ ! -f "src/tools.py" ] || [ ! -f "src/agent.py" ] || [ ! -d "frontend" ]; then
    log_error "Please run this script from the lovableclone directory"
fi

# Function to extract URL and update configurations
extract_and_configure() {
    local service_name="$1"
    local command="$2"
    local url_pattern="$3"
    local config_function="$4"
    
    log_step "$5" "Starting $service_name"
    
    # Start service in background and capture output
    echo "Running: $command"
    $command 2>&1 | while IFS= read -r line; do
        echo "$service_name: $line"
        
        # Extract URL using pattern
        url=$(echo "$line" | grep -oE "$url_pattern" | head -1)
        
        if [ ! -z "$url" ]; then
            log_success "$service_name URL detected: $url"
            
            # Call configuration function
            $config_function "$url"
            
            # Signal that URL was found
            touch "/tmp/${service_name,,}_url_found"
            break
        fi
    done &
    
    # Wait for URL to be found (with timeout)
    local timeout=120
    local count=0
    while [ $count -lt $timeout ]; do
        if [ -f "/tmp/${service_name,,}_url_found" ]; then
            rm -f "/tmp/${service_name,,}_url_found"
            return 0
        fi
        sleep 1
        ((count++))
    done
    
    log_error "Timeout waiting for $service_name to start"
}

# Configuration functions
configure_mcp() {
    local mcp_url="$1/sse"
    log_info "Configuring MCP URL: $mcp_url"
    
    # Update beam secret
    beam secret delete LOVABLE_MCP_URL 2>/dev/null || true
    beam secret create LOVABLE_MCP_URL "$mcp_url"
    
    # Update agent.py
    sed -i.backup "s|Agent(mcp_url=os.getenv(\"LOVABLE_MCP_URL\", \"[^\"]*\")|Agent(mcp_url=os.getenv(\"LOVABLE_MCP_URL\", \"$mcp_url\")|g" src/agent.py
    
    log_success "MCP configuration updated"
}

configure_agent() {
    local ws_url="$1"
    log_info "Configuring Agent WebSocket URL: $ws_url"
    
    # Update frontend .env
    if [ -f "frontend/.env" ]; then
        cp frontend/.env frontend/.env.backup
    elif [ -f "frontend/.env.template" ]; then
        cp frontend/.env.template frontend/.env
    else
        echo "VITE_BEAM_WS_URL=" > frontend/.env
        echo "VITE_BEAM_TOKEN=" >> frontend/.env
    fi
    
    # Update URLs in .env
    sed -i.backup "s|VITE_BEAM_WS_URL=.*|VITE_BEAM_WS_URL=$ws_url|g" frontend/.env
    
    # Ensure token is set
    if ! grep -q "VITE_BEAM_TOKEN=RXI" frontend/.env; then
        sed -i.backup "s|VITE_BEAM_TOKEN=.*|VITE_BEAM_TOKEN=RXIikfUgLJpEqLpA2t3CSOzoV058gII4jxJzbZqWxExLXb7PQsmqUnKWf6Vti4Qmha9LQF4yS-dGAfJQQbZY1Q==|g" frontend/.env
    fi
    
    log_success "Agent configuration updated"
}

# Start services sequentially
extract_and_configure "MCP" "beam serve src/tools.py:s" "https://[a-zA-Z0-9-]+\.app\.beam\.cloud" "configure_mcp" "1"

# Give MCP server time to fully start
sleep 5

extract_and_configure "Agent" "beam serve src/agent.py:handler" "wss://[a-zA-Z0-9-]+\.app\.beam\.cloud" "configure_agent" "2"

# Start frontend
log_step "3" "Starting Frontend"
cd frontend
npm run dev &
cd ..

# Show summary
echo ""
echo "============================================================"
log_success "🎉 LOVABLE CLONE IS NOW RUNNING!"
echo "============================================================"
echo "🔧 MCP Server:    $(grep -o 'https://[^"]*' src/agent.py | head -1)"
echo "🤖 Agent Service: $(grep 'VITE_BEAM_WS_URL=' frontend/.env | cut -d'=' -f2)"
echo "🌐 Frontend:      http://localhost:5173/"
echo "============================================================"
echo ""
log_success "💡 Open your browser to http://localhost:5173/"
echo "⚠️  Press Ctrl+C to stop all services"

# Keep script running
wait