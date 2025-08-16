# Lovable Clone Makefile
# ====================

.PHONY: start start-auto start-simple dev help clean generate install deploy deploy-mcp deploy-agent status frontend

# Default target
help:
	@echo "🚀 Lovable Clone Commands:"
	@echo ""
	@echo "📦 DEPLOYMENT (Permanent URLs):"
	@echo "  make deploy      - Deploy all services with permanent URLs"
	@echo "  make deploy-mcp  - Deploy only MCP server"
	@echo "  make deploy-agent - Deploy only agent service"
	@echo "  make status      - Check deployment status"
	@echo "  make frontend    - Start frontend only (uses deployed services)"
	@echo ""
	@echo "🔧 DEVELOPMENT (Dynamic URLs):"
	@echo "  make start       - Guided setup (dynamic URLs)"
	@echo "  make start-auto  - Fully automatic startup (experimental)"
	@echo "  make dev         - Alias for 'make start'"
	@echo ""
	@echo "🛠️  UTILITIES:"
	@echo "  make clean       - Clean up temporary files"
	@echo "  make generate    - Generate BAML client"
	@echo "  make install     - Install dependencies"
	@echo ""
	@echo "💡 Use 'make deploy' for permanent URLs or 'make start' for development!"

# Guided setup (recommended)
start:
	@echo "🚀 Starting Lovable Clone with guided setup..."
	python3 start_app_simple.py

# Fully automatic startup (experimental)
start-auto:
	@echo "🚀 Starting Lovable Clone automatically..."
	./start_app_auto.sh

# Alias for start
dev: start

# === DEPLOYMENT COMMANDS (Permanent URLs) ===

# Deploy all services
deploy: deploy-mcp deploy-agent
	@echo "✅ All services deployed with permanent URLs!"
	@echo "🔧 MCP Server:    https://lovable-mcp-server-6b17ffd-v5.app.beam.cloud"
	@echo "🤖 Agent Service: wss://lovable-agent-32a2c27-v2.app.beam.cloud"
	@echo "🌐 Frontend:      Run 'make frontend' to start"

# Deploy MCP server
deploy-mcp:
	@echo "📦 Deploying MCP server..."
	beam deploy src/tools.py:s --name lovable-mcp-server
	beam secret delete LOVABLE_MCP_URL || true
	beam secret create LOVABLE_MCP_URL 'https://lovable-mcp-server-6b17ffd-v5.app.beam.cloud/sse'
	@echo "✅ MCP server deployed with permanent URL"

# Deploy agent service  
deploy-agent:
	@echo "📦 Deploying agent service..."
	beam deploy src/agent.py:handler --name lovable-agent
	@echo "✅ Agent service deployed with permanent URL"

# Check deployment status
status:
	@echo "📊 Deployment Status:"
	@echo "====================="
	beam deployment list
	@echo ""
	@echo "📋 Recent Tasks:"
	@echo "================"
	beam task list --limit 5

# Start frontend only (uses deployed services)
frontend:
	@echo "🌐 Starting frontend with deployed services..."
	@echo "   MCP Server:  https://lovable-mcp-server-6b17ffd-v5.app.beam.cloud"
	@echo "   Agent:       wss://lovable-agent-32a2c27-v2.app.beam.cloud"
	@echo "   Frontend:    http://localhost:5173/"
	@echo ""
	cd frontend && npm run dev

# Generate BAML client
generate:
	@echo "Generating BAML client..."
	baml-cli generate

# Clean up temporary files
clean:
	@echo "Cleaning up..."
	rm -f /tmp/mcp_*.log /tmp/agent_*.log /tmp/frontend_*.log
	rm -f src/agent.py.backup frontend/.env.backup
	@echo " Cleanup complete"

# Install dependencies (for first-time setup)
install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt
	cd frontend && npm install
	@echo "Dependencies installed"