# DBeaver MCP Server

A production-ready Model Context Protocol (MCP) server that seamlessly integrates with DBeaver to provide AI assistants universal access to 200+ database types through your existing DBeaver connections. Built for real-world usage with Claude, Cursor, and other MCP-compatible AI assistants.

[![npm version](https://badge.fury.io/js/dbeaver-mcp-server.svg)](https://www.npmjs.com/package/dbeaver-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/dbeaver-mcp-server.svg)](https://www.npmjs.com/package/dbeaver-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/srthkdev/dbeaver-mcp-server.svg)](https://github.com/srthkdev/dbeaver-mcp-server)

<a href="https://glama.ai/mcp/servers/@srthkdev/dbeaver-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@srthkdev/dbeaver-mcp-server/badge" alt="DBeaver Server MCP server" />
</a>

## 🚀 Key Features

### 🔗 Universal Database Connectivity
- **200+ Database Types**: PostgreSQL, MySQL, Oracle, SQL Server, SQLite, MongoDB, and more
- **Zero Configuration**: Leverages your existing DBeaver connections
- **Auto-Detection**: Automatically finds and connects to your DBeaver workspace
- **Cross-Platform**: Windows, macOS, and Linux support

### 🛡️ Enterprise-Grade Security & Safety
- **Credential Management**: Uses DBeaver's secure credential storage
- **Query Validation**: Built-in protection against dangerous operations
- **Confirmation Prompts**: Destructive operations require explicit confirmation
- **Connection Validation**: All connections verified before operations
- **Error Handling**: Comprehensive error recovery and logging

### 📊 Advanced Data Operations
- **Read Operations**: Safe SELECT queries with automatic LIMIT protection
- **Write Operations**: INSERT, UPDATE, DELETE with validation
- **Schema Management**: Complete DDL operations (CREATE, ALTER, DROP)
- **Data Export**: CSV, JSON, XML, Excel export formats
- **Performance Monitoring**: Query execution time tracking
- **Native Execution**: Direct query support for PostgreSQL, MySQL/MariaDB, SQLite, and SQL Server/MSSQL

### 🧠 AI-Powered Intelligence
- **Business Insights**: Track and store analysis insights with tagging
- **Resource Browsing**: Browse table schemas through MCP resources
- **Smart Suggestions**: Context-aware database recommendations
- **Analysis Tracking**: Persistent storage of business intelligence findings

### 🔧 Developer Experience
- **MCP Protocol**: Full Model Context Protocol compliance
- **TypeScript**: Complete type safety and IntelliSense support
- **Debug Mode**: Comprehensive logging and troubleshooting
- **Version Compatibility**: Supports DBeaver 6.x through 21.x+

## 🔧 Version Compatibility

This MCP server automatically detects and supports both DBeaver configuration formats:

- **Legacy DBeaver (6.x)**: Uses XML-based configuration in `.metadata/.plugins/org.jkiss.dbeaver.core/`
- **Modern DBeaver (21.x+)**: Uses JSON-based configuration in `General/.dbeaver/`

The server will automatically detect your DBeaver version and use the appropriate configuration parser.

## 🛠️ Available Tools

### 📋 Connection Management
| Tool | Description | Safety Level |
|------|-------------|--------------|
| `list_connections` | List all DBeaver database connections | ✅ Safe |
| `get_connection_info` | Get detailed connection information | ✅ Safe |
| `test_connection` | Test database connectivity | ✅ Safe |

### 📊 Data Operations
| Tool | Description | Safety Level |
|------|-------------|--------------|
| `execute_query` | Execute SELECT queries (read-only) | ✅ Safe |
| `write_query` | Execute INSERT, UPDATE, DELETE queries | ⚠️ Modifies data |
| `export_data` | Export query results to CSV/JSON/XML/Excel | ✅ Safe |

### 🏗️ Schema Management
| Tool | Description | Safety Level |
|------|-------------|--------------|
| `list_tables` | List all tables and views in database | ✅ Safe |
| `get_table_schema` | Get detailed table schema information | ✅ Safe |
| `create_table` | Create new database tables | ⚠️ Schema changes |
| `alter_table` | Modify existing table schemas | ⚠️ Schema changes |
| `drop_table` | Remove tables (requires confirmation) | ❌ Destructive |

### 📈 Analytics & Intelligence
| Tool | Description | Safety Level |
|------|-------------|--------------|
| `get_database_stats` | Get database statistics and info | ✅ Safe |
| `append_insight` | Add business insights to memo | ✅ Safe |
| `list_insights` | List stored business insights | ✅ Safe |

## 📋 Prerequisites

- Node.js 18+ 
- DBeaver installed and configured with at least one connection
- Claude Desktop, Cursor, or another MCP-compatible client
- For MySQL (including MySQL 8) and most other databases, query execution uses the DBeaver executable in headless mode (set `DBEAVER_PATH` if auto-detection fails)

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
| Variable | Description | Default |
|----------|-------------|---------|
| `DBEAVER_PATH` | Path to DBeaver executable | Auto-detected |
| `DBEAVER_WORKSPACE` | Path to DBeaver workspace directory | OS default |
| `DBEAVER_TIMEOUT` | Query timeout in milliseconds | `30000` |
| `DBEAVER_DEBUG` | Enable debug logging | `false` |
| `DBEAVER_READ_ONLY` | Disable all write operations | `false` |
| `DBEAVER_DISABLED_TOOLS` | Comma-separated list of tools to disable | None |

### Read-Only Mode
Enable read-only mode to prevent any write operations:
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
Disable specific tools while keeping others enabled:
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

## 💡 Quick Start Examples

### 🔍 Basic Database Operations
```bash
# List all your database connections
"Show me all my database connections"

# Execute a simple query
"Run this query on my PostgreSQL database: 
SELECT COUNT(*) FROM orders WHERE date > '2024-01-01'"

# Get table schema information
"What's the schema of the users table in my MySQL database?"

# Export data for analysis
"Export all customer data to CSV from my Oracle database"
```

### 🏗️ Schema Management
```bash
# Create new tables
"Create a new table called 'products' with columns id, name, price, created_at"

# Modify existing tables
"Add a 'description' column to the products table"

# Safe table removal (requires confirmation)
"I want to drop the test_table - make sure to confirm first"
```

### 📊 Business Intelligence & Analytics
```bash
# Data analysis with insights
"Find the top 10 customers by order value and save this insight"

# Track business findings
"The Q4 sales data shows a 23% increase in mobile orders - tag this as 'quarterly-analysis'"

# Review past analysis
"Show me all insights related to sales performance"
```

### 🔧 Advanced Use Cases
```bash
# Performance analysis
"Analyze query performance and identify slow queries in my production database"

# Data quality checks
"Check for missing or invalid data in the customer table"

# Migration planning
"Help me analyze the current schema for migrating from MySQL to PostgreSQL"
```

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

## 🆚 Why Choose DBeaver MCP Server?

### 🏆 Industry-Leading Features
| Feature | DBeaver MCP | Other MCP Servers |
|---------|-------------|-------------------|
| **Database Support** | 200+ databases | 4-5 databases |
| **Configuration** | Zero config (uses existing DBeaver) | Manual setup required |
| **Schema Browsing** | ✅ MCP Resources | ❌ Limited |
| **Business Intelligence** | ✅ Insights tracking | ❌ Not available |
| **DDL Operations** | ✅ Complete (CREATE, ALTER, DROP) | ⚠️ Limited |
| **Safety Features** | ✅ Advanced validation | ⚠️ Basic |
| **Export Formats** | ✅ CSV, JSON, XML, Excel | ⚠️ Limited |
| **Error Handling** | ✅ Production-ready | ⚠️ Basic |
| **Cross-Platform** | ✅ Windows, macOS, Linux | ⚠️ Limited |

### 🎯 Perfect For
- **Data Analysts**: Comprehensive database access with AI assistance
- **Database Administrators**: Complete schema management and monitoring
- **Developers**: Seamless integration with existing DBeaver workflows
- **Business Intelligence**: Advanced analytics with insight tracking
- **Enterprise Teams**: Production-ready with enterprise security features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📦 NPM Package

This project is published on npm as `dbeaver-mcp-server`:

[![npm package](https://img.shields.io/npm/v/dbeaver-mcp-server.svg)](https://www.npmjs.com/package/dbeaver-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/dbeaver-mcp-server.svg)](https://www.npmjs.com/package/dbeaver-mcp-server)

- **Package**: [dbeaver-mcp-server](https://www.npmjs.com/package/dbeaver-mcp-server)
- **Install**: `npm install -g dbeaver-mcp-server`
- **Current Version**: 1.2.4
- **License**: MIT
- **GitHub**: [srthkdev/dbeaver-mcp-server](https://github.com/srthkdev/dbeaver-mcp-server)

## 📝 License
MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Anthropic for the Model Context Protocol
- DBeaver for the amazing database tool
- The open source community for inspiration and feedback

> **Note**: This project is not officially affiliated with DBeaver or Anthropic. It's designed for real-world production use with AI assistants.
