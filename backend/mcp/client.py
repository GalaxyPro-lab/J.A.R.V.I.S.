import os
import json
import asyncio
import httpx
from typing import Dict, Any, List, Optional

class MCPServerInstance:
    def __init__(self, server_id: str, name: str, transport: str, command: Optional[str] = None, args: Optional[List[str]] = None, env: Optional[Dict[str, str]] = None, url: Optional[str] = None, permissions: Optional[Dict[str, Any]] = None):
        self.server_id = server_id
        self.name = name
        self.transport = transport
        self.command = command
        self.args = args or []
        self.env = env or {}
        self.url = url
        self.permissions = permissions or {}
        self.is_connected = False
        self.tools: List[Dict[str, Any]] = []
        self.last_error: Optional[str] = None

    async def connect_and_discover(self) -> Dict[str, Any]:
        """
        Connect to MCP server and fetch list of available tools.
        """
        if self.transport == "stdio":
            return await self._discover_stdio()
        elif self.transport in ("sse", "http"):
            return await self._discover_http()
        else:
            self.last_error = f"Unsupported transport: {self.transport}"
            return {"success": False, "error": self.last_error}

    async def _discover_stdio(self) -> Dict[str, Any]:
        if not self.command:
            self.last_error = "No command provided for stdio MCP server"
            return {"success": False, "error": self.last_error}
        
        try:
            # We run the command with JSON-RPC initialize and tools/list
            # For demonstration and robust offline execution, if binary is not installed, provide clean diagnostics
            full_env = os.environ.copy()
            full_env.update(self.env)
            
            # Start process
            cmd = [self.command] + self.args
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=full_env
            )

            # Send initialize message
            init_req = json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "Jarvis-MCP-Client", "version": "1.0.0"}
                }
            }) + "\n"

            tools_req = json.dumps({
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/list",
                "params": {}
            }) + "\n"

            payload = (init_req + tools_req).encode()
            stdout, stderr = await asyncio.wait_for(proc.communicate(input=payload), timeout=8.0)

            # Parse lines from stdout
            lines = stdout.decode().splitlines()
            discovered_tools = []
            for line in lines:
                try:
                    msg = json.loads(line)
                    if msg.get("id") == 2 and "result" in msg:
                        raw_tools = msg["result"].get("tools", [])
                        for t in raw_tools:
                            discovered_tools.append({
                                "type": "function",
                                "function": {
                                    "name": f"mcp_{self.name.lower().replace(' ', '_')}_{t.get('name')}",
                                    "description": f"[{self.name}] {t.get('description', '')}",
                                    "parameters": t.get("inputSchema", {"type": "object", "properties": {}})
                                },
                                "_mcp_server_id": self.server_id,
                                "_mcp_tool_name": t.get("name")
                            })
                except Exception:
                    pass

            self.tools = discovered_tools
            self.is_connected = True
            self.last_error = None
            return {"success": True, "tools_count": len(self.tools), "tools": self.tools}

        except FileNotFoundError:
            self.is_connected = False
            self.last_error = f"Executable '{self.command}' non trovato nel PATH di sistema."
            return {"success": False, "error": self.last_error}
        except asyncio.TimeoutError:
            self.is_connected = False
            self.last_error = "Timeout during stdio MCP handshake."
            return {"success": False, "error": self.last_error}
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            return {"success": False, "error": str(e)}

    async def _discover_http(self) -> Dict[str, Any]:
        if not self.url:
            self.last_error = "No URL provided for HTTP/SSE MCP server"
            return {"success": False, "error": self.last_error}
        
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    f"{self.url.rstrip('/')}/tools/list",
                    json={"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    raw_tools = data.get("result", {}).get("tools", [])
                    discovered_tools = []
                    for t in raw_tools:
                        discovered_tools.append({
                            "type": "function",
                            "function": {
                                "name": f"mcp_{self.name.lower().replace(' ', '_')}_{t.get('name')}",
                                "description": f"[{self.name}] {t.get('description', '')}",
                                "parameters": t.get("inputSchema", {"type": "object", "properties": {}})
                            },
                            "_mcp_server_id": self.server_id,
                            "_mcp_tool_name": t.get("name")
                        })
                    self.tools = discovered_tools
                    self.is_connected = True
                    self.last_error = None
                    return {"success": True, "tools_count": len(self.tools), "tools": self.tools}
                else:
                    self.last_error = f"HTTP status {resp.status_code}"
                    return {"success": False, "error": self.last_error}
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            return {"success": False, "error": str(e)}

    async def execute_tool(self, original_tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Execute tool call via stdio or HTTP
        """
        if self.transport == "stdio":
            full_env = os.environ.copy()
            full_env.update(self.env)
            cmd = [self.command] + self.args
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=full_env
            )
            req = json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": original_tool_name,
                    "arguments": arguments
                }
            }) + "\n"
            stdout, stderr = await asyncio.wait_for(proc.communicate(input=req.encode()), timeout=15.0)
            lines = stdout.decode().splitlines()
            for line in lines:
                try:
                    msg = json.loads(line)
                    if msg.get("id") == 1:
                        return msg.get("result", msg.get("error"))
                except Exception:
                    pass
            return {"raw_output": stdout.decode()}
        elif self.transport in ("sse", "http"):
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{self.url.rstrip('/')}/tools/call",
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "tools/call",
                        "params": {"name": original_tool_name, "arguments": arguments}
                    }
                )
                return resp.json()

class MCPManager:
    def __init__(self):
        self._servers: Dict[str, MCPServerInstance] = {}

    def register_server(self, server_id: str, name: str, transport: str, command: Optional[str] = None, args: Optional[List[str]] = None, env: Optional[Dict[str, str]] = None, url: Optional[str] = None, permissions: Optional[Dict[str, Any]] = None) -> MCPServerInstance:
        instance = MCPServerInstance(
            server_id=server_id,
            name=name,
            transport=transport,
            command=command,
            args=args,
            env=env,
            url=url,
            permissions=permissions
        )
        self._servers[server_id] = instance
        return instance

    def get_server(self, server_id: str) -> Optional[MCPServerInstance]:
        return self._servers.get(server_id)

    def remove_server(self, server_id: str):
        self._servers.pop(server_id, None)

    async def get_tools_for_servers(self, enabled_server_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        tools = []
        for server_id, server in self._servers.items():
            if enabled_server_ids is None or server_id in enabled_server_ids:
                if not server.is_connected:
                    await server.connect_and_discover()
                tools.extend(server.tools)
        return tools

    async def execute_tool(self, formatted_tool_name: str, arguments: Dict[str, Any]) -> Any:
        for server in self._servers.values():
            for t in server.tools:
                if t.get("function", {}).get("name") == formatted_tool_name:
                    orig_name = t.get("_mcp_tool_name", formatted_tool_name)
                    return await server.execute_tool(orig_name, arguments)
        raise ValueError(f"No MCP server found handling tool: {formatted_tool_name}")

mcp_manager = MCPManager()
