# DBeaver MCP Server

A Model Context Protocol (MCP) server that integrates with DBeaver to provide AI assistants access to 200+ database types through DBeaver's existing connections.

## 🚀 Features

- **Universal Database Support**: Works with all 200+ database types supported by DBeaver
- **Zero Configuration**: Uses your existing DBeaver connections
- **Secure**: Leverages DBeaver's credential management
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Production Ready**: Full error handling and logging

## 📋 Prerequisites

- Node.js 18+ 
- DBeaver installed and configured with at least one connection
- Claude Desktop or another MCP-compatible client

## 🛠️ Installation

See the [Installation Guide](docs/installations.md) for full details.

### Quick Start
```bash
npm install -g dbeaver-mcp-server
dbeaver-mcp-server
```

## 🖥️ Configuration

See the [Configuration Guide](docs/configurations.md) for Claude Desktop and environment variable options.

## 💡 Usage Examples

See [examples/samples-queries.md](examples/samples-queries.md) for more.

- **List all connections:**
  > "Show me all my database connections"
- **Run a query:**
  > "Run this query on my PostgreSQL database: SELECT COUNT(*) FROM orders WHERE date > '2024-01-01'"
- **Get table schema:**
  > "What's the schema of the users table in my MySQL database?"
- **Export data:**
  > "Export all customer data to CSV from my Oracle database"

## 🛠️ Scripts

- `scripts/build.sh`: Build the project
- `scripts/install.sh`: Install dependencies and build

## 📝 Documentation

- [Installation Guide](docs/installations.md)
- [Configuration Guide](docs/configurations.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

Fork the repository, create a feature branch, make your changes, add tests if applicable, and submit a pull request.

## 📝 License
MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Anthropic for the Model Context Protocol
DBeaver for the amazing database tool
The open source community for inspiration and feedback

> Note: This project is not officially affiliated with DBeaver or Anthropic.


