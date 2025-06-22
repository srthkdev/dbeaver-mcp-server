# Configuration Guide

## Claude Desktop Integration

To use DBeaver MCP Server with Claude Desktop, add the following to your configuration file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server",
      "env": {
        "DBEAVER_DEBUG": "false",
        "DBEAVER_TIMEOUT": "30000"
      }
    }
  }
}
```

## Environment Variables

- `DBEAVER_PATH`: Set a custom path to the DBeaver executable if not auto-detected.
- `DBEAVER_TIMEOUT`: Set the query timeout in milliseconds (default: 30000).
- `DBEAVER_DEBUG`: Set to `true` to enable debug logging.

Example:
```bash
export DBEAVER_PATH="/custom/path/to/dbeaver"
export DBEAVER_TIMEOUT=60000
export DBEAVER_DEBUG=true
```

## Advanced MCP Client Configuration

For other MCP clients, use the command:
```bash
dbeaver-mcp-server
```
