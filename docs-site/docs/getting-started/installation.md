# Installation Guide

## System Requirements

- **Node.js**: Version 18.0.0 or higher
- **DBeaver**: Latest version recommended
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

## Pre-Installation Steps

### 1. Verify DBeaver Installation
```bash
# Check if DBeaver is accessible
dbeaver --version
```

### 2. Configure DBeaver Connections
- Open DBeaver
- Create and test at least one database connection
- Ensure connections are saved with credentials

## Installation Methods

### Method 1: Global npm Installation (Recommended)
```bash
# Install from npm registry
npm install -g dbeaver-mcp-server

# Verify installation
dbeaver-mcp-server --help
```

### Method 2: Local Development Installation
```bash
git clone https://github.com/srthkdev/dbeaver-mcp-server.git
cd dbeaver-mcp-server
npm install
npm run build
npm link  # Makes the command available globally
```

### Method 3: Direct Download
- Download the latest release from GitHub
- Extract to desired directory
- Run `npm install` in the extracted directory
- Add the directory to your PATH

## Post-Installation Configuration

### Claude Desktop Setup

Locate Config File:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Add MCP Server Configuration:
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

Restart Claude Desktop

## Verification
Test the installation:
```bash
# Test help command
dbeaver-mcp-server --help

# Test MCP server functionality
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | dbeaver-mcp-server
# Should return available tools
```

## Platform-Specific Notes

### Windows
- Use PowerShell or Command Prompt as Administrator for global installation
- DBeaver path is usually auto-detected
- May need to set DBEAVER_PATH environment variable if using portable version

### macOS
- May need to allow Terminal access to DBeaver in System Preferences
- Use Homebrew for Node.js installation: `brew install node`
- DBeaver app bundle is automatically detected

### Linux
- Install via package manager: `sudo apt install nodejs npm` (Ubuntu/Debian)
- DBeaver AppImage and package installations are both supported
- May need to set execute permissions: `chmod +x dbeaver-mcp-server`

## Environment Variables

Configure the server behavior with these environment variables:

- `DBEAVER_PATH`: Path to DBeaver executable (auto-detected if not set)
- `DBEAVER_TIMEOUT`: Query timeout in milliseconds (default: 30000)
- `DBEAVER_DEBUG`: Enable debug logging (true/false)

Example:
```bash
export DBEAVER_DEBUG=true
export DBEAVER_TIMEOUT=60000
dbeaver-mcp-server
```

## Troubleshooting Installation

### Common Issues

- "dbeaver-mcp-server command not found"
  - Ensure npm global bin directory is in PATH
  - Try `npm config get prefix` to find global directory
  - Add `[prefix]/bin` to PATH
- Permission errors on Linux/macOS
  - `sudo chown -R $(whoami) ~/.npm`
- Node.js version issues
  - Use nvm to manage Node.js versions
  - Install recommended version: `nvm install 18 && nvm use 18`
- Binary execution issues
  - Ensure the package was installed correctly: `npm install -g dbeaver-mcp-server@latest`
  - Check if the binary has execute permissions

## Getting Help
- Check the [Troubleshooting Guide](../troubleshooting.md)
- Open an issue on [GitHub](https://github.com/srthkdev/dbeaver-mcp-server/issues)
- View the package on [npm](https://www.npmjs.com/package/dbeaver-mcp-server)
