import tempfile
from pathlib import Path

from beam import Image, Sandbox
from beam.integrations import MCPServer
from fastmcp import FastMCP

mcp = FastMCP(name="lovable-clone-mcp")
image = (
    Image()
    .from_registry("node:20")
    .add_commands(
        [
            "apt-get update && apt-get install -y git curl",
            "git clone https://github.com/beam-cloud/react-vite-shadcn-ui.git /app",
            "cd /app && rm -f pnpm-lock.yaml && npm install && echo 'npm install done........'",
            "cd /app && npm install @tanstack/react-query react-router-dom recharts sonner zod react-hook-form @hookform/resolvers date-fns uuid",
        ]
    )
)

DEFAULT_CODE_PATH = "/app/src"
DEFAULT_PROJECT_ROOT = "/app"


@mcp.tool
def create_app_environment() -> dict:
    """
    MCP TOOL: CREATE_APP_ENVIRONMENT
    
    This is where the LIVE PREVIEW URL is generated!
    
    SANDBOX CREATION PROCESS:
    1. Beam Cloud creates isolated container with Node.js + React template
    2. Installs dependencies (npm install) with upgraded resources (2 CPU, 2GB RAM)
    3. Starts development server on port 3000 
    4. Exposes port to generate public URL for iframe preview
    5. Returns sandbox_id and preview_url to frontend
    
    URL GENERATION: Beam Cloud's expose_port(3000) creates unique public URL
    Format: https://sandbox-{id}.beam.cloud 
    This URL is embedded in frontend's iframe for live preview
    """
    print("Creating app environment...")

    # Create isolated sandbox environment with upgraded resources
    sandbox = Sandbox(
        name="lovable-clone",
        cpu=1,                    
        memory=1024,              
        image=image,              # Pre-built image with Node.js 20 + React template
        keep_warm_seconds=300,    
    ).create()

    # LIVE PREVIEW URL GENERATION: This creates the public URL for iframe
    # Beam Cloud automatically handles routing and SSL certificates
    url = sandbox.expose_port(3000)
    print(f"React app created and started successfully! Access it at: {url}")
    
    # Start React development server with iframe-compatible configuration
    # --host :: allows external connections (required for Beam Cloud routing)
    # __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS allows .beam.cloud domain
    sandbox.process.exec(
        "sh",
        "-c",
        "cd /app && __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.beam.cloud npm run dev -- --host :: --port 3000",
    )

    print("Created app environment...")
    return {
        "url": url,                    # Live preview URL for frontend iframe
        "sandbox_id": sandbox.sandbox_id(),  # Unique ID for future operations
    }


@mcp.tool
def load_code(sandbox_id: str) -> tuple[dict, str]:
    print(f"Loading code for sandbox {sandbox_id}")

    sandbox = Sandbox().connect(sandbox_id)
    sandbox.update_ttl(300)

    file_map = {}

    def _process_directory(dir_path: str):
        for file in sandbox.fs.list_files(dir_path):
            full_path = Path(dir_path) / file.name

            if file.is_dir:
                # Recursively process subdirectories
                _process_directory(str(full_path))
            else:
                # Download file
                with tempfile.NamedTemporaryFile() as temp_file:
                    sandbox.fs.download_file(str(full_path), temp_file.name)
                    temp_file.seek(0)
                    file_content = temp_file.read()
                    file_map[str(full_path)] = file_content

    _process_directory(DEFAULT_CODE_PATH)

    package_json = "{}"
    with tempfile.NamedTemporaryFile() as temp_file:
        sandbox.fs.download_file(f"{DEFAULT_PROJECT_ROOT}/package.json", temp_file.name)
        temp_file.seek(0)
        package_json = temp_file.read().decode("utf-8")

    return file_map, package_json


@mcp.tool
def edit_code(sandbox_id: str, code_map: dict) -> dict:
    print(f"Editing code for sandbox {sandbox_id}")

    sandbox = Sandbox().connect(sandbox_id)
    sandbox.update_ttl(300)

    for sandbox_path, content in code_map.items():
        with tempfile.NamedTemporaryFile() as temp_file:
            temp_file.write(content.encode("utf-8"))
            temp_file.seek(0)

            # Get parent directory and check if it exists
            parent_dir = str(Path(sandbox_path).parent)
            try:
                sandbox.fs.stat_file(parent_dir)
            except BaseException:
                # Parent directory doesn't exist, create it
                print(f"Creating parent directory: {parent_dir}")
                sandbox.process.exec("mkdir", "-p", parent_dir).wait()

            sandbox.fs.upload_file(temp_file.name, sandbox_path)

    return {"sandbox_id": sandbox.sandbox_id()}


@mcp.tool
def get_code_for_display(sandbox_id: str) -> dict:
    """Fetch code files from sandbox for display in the frontend"""
    print(f"Getting code for display from sandbox {sandbox_id}")
    
    sandbox = Sandbox().connect(sandbox_id)
    sandbox.update_ttl(300)
    
    file_map = {}
    
    def _process_directory(dir_path: str):
        try:
            for file in sandbox.fs.list_files(dir_path):
                full_path = Path(dir_path) / file.name
                
                if file.is_dir:
                    # Recursively process subdirectories
                    _process_directory(str(full_path))
                else:
                    # Only include certain file types for display
                    if full_path.suffix in ['.tsx', '.ts', '.jsx', '.js', '.css', '.json', '.html']:
                        try:
                            with tempfile.NamedTemporaryFile() as temp_file:
                                sandbox.fs.download_file(str(full_path), temp_file.name)
                                temp_file.seek(0)
                                file_content = temp_file.read().decode('utf-8')
                                # Convert to relative path for display
                                relative_path = str(full_path).replace(DEFAULT_CODE_PATH + "/", "")
                                file_map[relative_path] = file_content
                        except Exception as e:
                            print(f"Error reading file {full_path}: {e}")
        except Exception as e:
            print(f"Error listing directory {dir_path}: {e}")
    
    _process_directory(DEFAULT_CODE_PATH)
    
    # Also get package.json for reference
    try:
        with tempfile.NamedTemporaryFile() as temp_file:
            sandbox.fs.download_file(f"{DEFAULT_PROJECT_ROOT}/package.json", temp_file.name)
            temp_file.seek(0)
            package_json = temp_file.read().decode("utf-8")
            file_map["package.json"] = package_json
    except Exception as e:
        print(f"Error reading package.json: {e}")
    
    return {
        "sandbox_id": sandbox_id,
        "files": file_map
    }


s = MCPServer(mcp, cpu=1, memory=1024, keep_warm_seconds=600, concurrent_requests=1000)
