# Configuration Guide

## Claude Desktop Integration

To use DBeaver MCP Server with Claude Desktop, add the following to your configuration file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### Basic Configuration
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

### Advanced Configuration
```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server",
      "env": {
        "DBEAVER_DEBUG": "true",
        "DBEAVER_TIMEOUT": "60000",
        "DBEAVER_PATH": "/Applications/DBeaver.app/Contents/MacOS/dbeaver"
      }
    }
  }
}
```

## Environment Variables

### Core Variables
- `DBEAVER_PATH`: Set a custom path to the DBeaver executable if not auto-detected
- `DBEAVER_TIMEOUT`: Set the query timeout in milliseconds (default: 30000)
- `DBEAVER_DEBUG`: Set to `true` to enable debug logging

### Platform-Specific Paths
```bash
# macOS
export DBEAVER_PATH="/Applications/DBeaver.app/Contents/MacOS/dbeaver"

# Windows
export DBEAVER_PATH="C:\\Program Files\\DBeaver\\dbeaver.exe"

# Linux
export DBEAVER_PATH="/usr/bin/dbeaver"
```

### Configuration Examples
```bash
# Development with debug logging
export DBEAVER_DEBUG=true
export DBEAVER_TIMEOUT=60000
dbeaver-mcp-server

# Production with custom timeout
export DBEAVER_DEBUG=false
export DBEAVER_TIMEOUT=120000
dbeaver-mcp-server
```

## Cursor IDE Integration

For Cursor IDE, add to your settings:

```json
{
  "mcp.servers": {
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

## Advanced MCP Client Configuration

### Command Line Usage
```bash
# Basic usage
dbeaver-mcp-server

# With environment variables
DBEAVER_DEBUG=true dbeaver-mcp-server

# Test MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | dbeaver-mcp-server
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
RUN npm install -g dbeaver-mcp-server
ENV DBEAVER_DEBUG=false
ENV DBEAVER_TIMEOUT=30000
CMD ["dbeaver-mcp-server"]
```

## Troubleshooting Configuration

### Common Issues
1. **DBeaver not found**: Set `DBEAVER_PATH` environment variable
2. **Permission denied**: Ensure DBeaver executable has proper permissions
3. **Timeout errors**: Increase `DBEAVER_TIMEOUT` value
4. **Debug information needed**: Set `DBEAVER_DEBUG=true`

### Verification Commands
```bash
# Check if DBeaver is accessible
which dbeaver
dbeaver --version

# Test MCP server
dbeaver-mcp-server --help

# Check environment variables
echo $DBEAVER_PATH
echo $DBEAVER_DEBUG
echo $DBEAVER_TIMEOUT
```
