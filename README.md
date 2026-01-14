# DBeaver MCP Server

MCP server that provides AI assistants access to databases through DBeaver connections.

[![npm version](https://badge.fury.io/js/dbeaver-mcp-server.svg)](https://www.npmjs.com/package/dbeaver-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

<a href="https://glama.ai/mcp/servers/@srthkdev/dbeaver-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@srthkdev/dbeaver-mcp-server/badge" alt="DBeaver Server MCP server" />
</a>

## Features

- Uses existing DBeaver connections (no separate config needed)
- Native query execution for PostgreSQL, MySQL/MariaDB, SQLite, SQL Server
- Falls back to DBeaver CLI for other database types
- Read-only mode and tool filtering
- Query validation to block dangerous operations
- Data export to CSV/JSON

## Requirements

- Node.js 18+
- DBeaver with at least one configured connection

## Installation

```bash
npm install -g dbeaver-mcp-server
```

## Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server"
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DBEAVER_PATH` | Path to DBeaver executable | Auto-detected |
| `DBEAVER_WORKSPACE` | Path to DBeaver workspace | OS default |
| `DBEAVER_TIMEOUT` | Query timeout (ms) | `30000` |
| `DBEAVER_DEBUG` | Enable debug logging | `false` |
| `DBEAVER_READ_ONLY` | Disable write operations | `false` |
| `DBEAVER_DISABLED_TOOLS` | Comma-separated tools to disable | None |

### Read-Only Mode

```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server",
      "env": {
        "DBEAVER_READ_ONLY": "true"
      }
    }
  }
}
```

### Disable Specific Tools

```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server",
      "env": {
        "DBEAVER_DISABLED_TOOLS": "drop_table,alter_table"
      }
    }
  }
}
```

## Available Tools

### Connection Management
- `list_connections` - List all DBeaver connections
- `get_connection_info` - Get connection details
- `test_connection` - Test connectivity

### Data Operations
- `execute_query` - Run SELECT queries
- `write_query` - Run INSERT/UPDATE/DELETE
- `export_data` - Export to CSV/JSON

### Schema Management
- `list_tables` - List tables and views
- `get_table_schema` - Get table structure
- `create_table` - Create tables
- `alter_table` - Modify tables
- `drop_table` - Drop tables (requires confirmation)

### Other
- `get_database_stats` - Database statistics
- `append_insight` - Store analysis notes
- `list_insights` - Retrieve stored notes

## DBeaver Version Support

Supports both configuration formats:
- DBeaver 6.x: XML config in `.metadata/.plugins/org.jkiss.dbeaver.core/`
- DBeaver 21.x+: JSON config in `General/.dbeaver/`

## Development

```bash
git clone https://github.com/srthkdev/dbeaver-mcp-server.git
cd dbeaver-mcp-server
npm install
npm run build
npm test
npm run lint
```

## License

MIT
