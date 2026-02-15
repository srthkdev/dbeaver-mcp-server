# DBeaver MCP Server

MCP server that provides AI assistants access to databases through DBeaver connections.

[![npm version](https://badge.fury.io/js/dbeaver-mcp-server.svg)](https://www.npmjs.com/package/dbeaver-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

<a href="https://glama.ai/mcp/servers/@srthkdev/dbeaver-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@srthkdev/dbeaver-mcp-server/badge" alt="DBeaver Server MCP server" />
</a>

## Database Support

**Natively supported** (direct driver, fast):
- PostgreSQL (via `pg`)
- MySQL / MariaDB (via `mysql2`)
- SQL Server / MSSQL (via `mssql`)
- SQLite (via `sqlite3` CLI)

**Postgres-compatible** (routed through `pg` driver automatically):
- CockroachDB, TimescaleDB, Amazon Redshift, YugabyteDB, AlloyDB, Supabase, Neon, Citus

**Other databases**: Falls back to DBeaver CLI. Requires DBeaver to be installed and the connection configured in your DBeaver workspace. Results vary by DBeaver version.

## Features

- Uses existing DBeaver connections (no separate config needed)
- Native query execution for PostgreSQL, MySQL/MariaDB, SQLite, SQL Server
- Connection pooling with configurable pool size and timeouts
- Transaction support (BEGIN/COMMIT/ROLLBACK)
- Query execution plan analysis (EXPLAIN)
- Schema comparison between connections with migration script generation
- Read-only mode with enforced SELECT-only on `execute_query`
- Connection whitelist to restrict which databases are accessible
- Tool filtering to disable specific operations
- Query validation to block dangerous operations (DROP DATABASE, TRUNCATE, DELETE/UPDATE without WHERE)
- Data export to CSV/JSON
- Graceful shutdown with connection pool cleanup

## Requirements

- Node.js 18+
- DBeaver with at least one configured connection

## Installation

```bash
npm install -g dbeaver-mcp-server
```

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server"
    }
  }
}
```

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server"
    }
  }
}
```

### Cursor

Add to Cursor Settings > MCP Servers:

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
| `DBEAVER_READ_ONLY` | Disable all write operations | `false` |
| `DBEAVER_ALLOWED_CONNECTIONS` | Comma-separated whitelist of connection IDs or names | All |
| `DBEAVER_DISABLED_TOOLS` | Comma-separated tools to disable | None |
| `DBEAVER_POOL_MIN` | Minimum connections per pool | `2` |
| `DBEAVER_POOL_MAX` | Maximum connections per pool | `10` |
| `DBEAVER_POOL_IDLE_TIMEOUT` | Idle connection timeout (ms) | `30000` |
| `DBEAVER_POOL_ACQUIRE_TIMEOUT` | Connection acquire timeout (ms) | `10000` |

### Read-Only Mode

Blocks all write operations. The `execute_query` tool only allows SELECT, EXPLAIN, SHOW, and DESCRIBE statements. Transaction tools are disabled entirely.

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

### Connection Whitelist

Restrict which DBeaver connections are visible. Accepts connection IDs or display names, comma-separated:

```json
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server",
      "env": {
        "DBEAVER_ALLOWED_CONNECTIONS": "dev-postgres,staging-mysql"
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
        "DBEAVER_DISABLED_TOOLS": "drop_table,alter_table,write_query"
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
- `execute_query` - Run read-only queries (SELECT, EXPLAIN, SHOW, DESCRIBE only)
- `write_query` - Run INSERT/UPDATE/DELETE
- `export_data` - Export to CSV/JSON

### Schema Management
- `list_tables` - List tables and views
- `get_table_schema` - Get table structure
- `create_table` - Create tables
- `alter_table` - Modify tables
- `drop_table` - Drop tables (requires confirmation)

### Transactions
- `begin_transaction` - Start a new transaction
- `execute_in_transaction` - Execute query within a transaction
- `commit_transaction` - Commit a transaction
- `rollback_transaction` - Roll back a transaction

### Query Analysis
- `explain_query` - Analyze query execution plan
- `compare_schemas` - Compare schemas between two connections
- `get_pool_stats` - Get connection pool statistics

### Other
- `get_database_stats` - Database statistics
- `append_insight` - Store analysis notes
- `list_insights` - Retrieve stored notes

## Security

- **Read-only enforcement**: `execute_query` only accepts read-only statements (SELECT, EXPLAIN, SHOW, DESCRIBE, PRAGMA). Write operations must use `write_query`.
- **Query validation**: Blocks DROP DATABASE, DROP SCHEMA, TRUNCATE, DELETE/UPDATE without WHERE, GRANT, REVOKE, and user management statements.
- **Connection whitelist**: Restrict which connections are exposed via `DBEAVER_ALLOWED_CONNECTIONS`.
- **Tool filtering**: Disable any tool via `DBEAVER_DISABLED_TOOLS`.
- **Input sanitization**: Connection IDs and SQL identifiers are sanitized to prevent injection.
- **Recommendation**: For production use, also use a database-level read-only user for defense in depth.

## DBeaver Version Support

Supports both configuration formats:
- DBeaver 6.x: XML config in `.metadata/.plugins/org.jkiss.dbeaver.core/`
- DBeaver 21.x+: JSON config in `General/.dbeaver/`

Credentials are automatically decrypted from DBeaver's `credentials-config.json`.

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
