# DBeaver MCP Server

A Model Context Protocol (MCP) server that integrates with DBeaver to provide AI assistants access to 200+ database types through DBeaver's existing connections. This MCP server is designed to be production-ready and feature-complete for real-world usage with Claude, Cursor, and other MCP-compatible AI assistants.

[![npm version](https://badge.fury.io/js/dbeaver-mcp-server.svg)](https://badge.fury.io/js/dbeaver-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## 🚀 Features

- **Universal Database Support**: Works with all 200+ database types supported by DBeaver
- **Zero Configuration**: Uses your existing DBeaver connections
- **Secure**: Leverages DBeaver's credential management
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Production Ready**: Full error handling, logging, and safety checks
- **Resource Support**: Browse table schemas through MCP resources
- **Business Insights**: Track and store analysis insights with tagging
- **Multiple Export Formats**: CSV, JSON export capabilities
- **Schema Management**: Complete DDL operations (CREATE, ALTER, DROP)
- **Safety First**: Built-in query validation and confirmation prompts

## 🛠️ Available Tools

| Tool | Description | Safety Level |
|------|-------------|--------------|
| `list_connections` | List all DBeaver database connections | ✅ Safe |
| `get_connection_info` | Get detailed connection information | ✅ Safe |
| `execute_query` | Execute SELECT queries (read-only) | ✅ Safe |
| `write_query` | Execute INSERT, UPDATE, DELETE queries | ⚠️ Modifies data |
| `create_table` | Create new database tables | ⚠️ Schema changes |
| `alter_table` | Modify existing table schemas | ⚠️ Schema changes |
| `drop_table` | Remove tables (requires confirmation) | ❌ Destructive |
| `get_table_schema` | Get detailed table schema information | ✅ Safe |
| `list_tables` | List all tables and views in database | ✅ Safe |
| `export_data` | Export query results to CSV/JSON | ✅ Safe |
| `test_connection` | Test database connectivity | ✅ Safe |
| `get_database_stats` | Get database statistics and info | ✅ Safe |
| `append_insight` | Add business insights to memo | ✅ Safe |
| `list_insights` | List stored business insights | ✅ Safe |

## 📋 Prerequisites

- Node.js 18+ 
- DBeaver installed and configured with at least one connection
- Claude Desktop, Cursor, or another MCP-compatible client

## 🛠️ Installation

### Quick Install (Recommended)
```bash
npm install -g dbeaver-mcp-server
```

### Verify Installation
```bash
dbeaver-mcp-server --help
```

### Manual Installation
```bash
git clone https://github.com/srthkdev/dbeaver-mcp-server.git
cd dbeaver-mcp-server
npm install
npm run build
npm link  # Makes the command available globally
```

## 🖥️ Configuration

### Claude Desktop Configuration
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

### Environment Variables
- `DBEAVER_PATH`: Path to DBeaver executable (auto-detected if not set)
- `DBEAVER_TIMEOUT`: Query timeout in milliseconds (default: 30000)
- `DBEAVER_DEBUG`: Enable debug logging (true/false)

## 💡 Usage Examples

### Basic Operations
- **List connections**: "Show me all my database connections"
- **Execute query**: "Run this query on my PostgreSQL database: SELECT COUNT(*) FROM orders WHERE date > '2024-01-01'"
- **Get schema**: "What's the schema of the users table in my MySQL database?"
- **Export data**: "Export all customer data to CSV from my Oracle database"

### Advanced Operations
- **Schema management**: "Create a new table called 'products' with columns id, name, price"
- **Data analysis**: "Find the top 10 customers by order value and save this insight"
- **Safety checks**: "I want to drop the test_table - make sure to confirm first"

### Business Intelligence
- **Track insights**: "The Q4 sales data shows a 23% increase in mobile orders - tag this as 'quarterly-analysis'"
- **Review analysis**: "Show me all insights related to sales performance"

## 🔧 Resource Browsing

The server provides MCP resources for browsing database schemas:
- Browse table schemas directly in your MCP client
- Resources are automatically discovered from your DBeaver connections
- Provides structured schema information in JSON format

## 🛡️ Safety Features

- **Query Validation**: Automatic detection of dangerous operations
- **Confirmation Requirements**: Destructive operations require explicit confirmation
- **Connection Validation**: All connections are verified before operations
- **Error Handling**: Comprehensive error messages and logging
- **Rate Limiting**: Built-in timeouts to prevent runaway queries

## 🚀 Production Features

- **Comprehensive Logging**: Debug mode for troubleshooting
- **Error Recovery**: Graceful handling of connection failures
- **Performance Monitoring**: Query execution time tracking
- **Business Context**: Insight tracking for data analysis workflows
- **Multi-format Export**: Support for CSV and JSON export formats

## 🛠️ Development

### Setup Development Environment
```bash
git clone https://github.com/srthkdev/dbeaver-mcp-server.git
cd dbeaver-mcp-server
npm install
```

### Available Scripts
```bash
npm run build          # Build the project
npm run dev            # Watch mode for development
npm run clean          # Clean build artifacts
npm run start          # Start the server
npm run test           # Run tests (placeholder)
npm run lint           # Run linter (placeholder)
```

### Publishing to npm
```bash
npm run publish        # Interactive publish script
npm run publish:patch  # Quick patch version (1.1.3 → 1.1.4)
npm run publish:minor  # Quick minor version (1.1.3 → 1.2.0)
npm run publish:major  # Quick major version (1.1.3 → 2.0.0)
```

### Build Scripts
- `scripts/build.sh`: Build the project
- `scripts/install.sh`: Install dependencies and build
- `scripts/publish.sh`: Publish to npm with checks

## 📝 Documentation

- [Installation Guide](docs/installations.md)
- [Configuration Guide](docs/configurations.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Usage Examples](examples/samples-queries.md)

## 🔄 Comparison with Other MCP Servers

This DBeaver MCP server provides:
- ✅ Universal database support (200+ databases vs. 4-5 in most MCP servers)
- ✅ Resource-based schema browsing
- ✅ Business insights tracking
- ✅ Complete DDL operations (CREATE, ALTER, DROP)
- ✅ Advanced safety features
- ✅ Multiple export formats
- ✅ Production-ready error handling
- ✅ Cross-platform compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📦 NPM Package

This project is published on npm as `dbeaver-mcp-server`:
- **Package**: https://www.npmjs.com/package/dbeaver-mcp-server
- **Install**: `npm install -g dbeaver-mcp-server`
- **Current Version**: 1.1.3
- **License**: MIT

## 📝 License
MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Anthropic for the Model Context Protocol
- DBeaver for the amazing database tool
- The open source community for inspiration and feedback

> **Note**: This project is not officially affiliated with DBeaver or Anthropic. It's designed for real-world production use with AI assistants.


