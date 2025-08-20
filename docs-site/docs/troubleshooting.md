# Troubleshooting Guide

## Installation Issues

### "dbeaver-mcp-server command not found"
```bash
# Solution 1: Reinstall the package
npm uninstall -g dbeaver-mcp-server
npm install -g dbeaver-mcp-server@latest

# Solution 2: Check npm global path
npm config get prefix
# Add the bin directory to your PATH

# Solution 3: Use npx
npx dbeaver-mcp-server --help
```

### Permission Errors
```bash
# Linux/macOS permission fix
sudo chown -R $(whoami) ~/.npm
npm install -g dbeaver-mcp-server

# Windows: Run as Administrator
# Open PowerShell as Administrator and run:
npm install -g dbeaver-mcp-server
```

### Node.js Version Issues
```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Update Node.js using nvm
nvm install 18
nvm use 18
npm install -g dbeaver-mcp-server
```

## Connection Issues

### DBeaver Not Found
```bash
# Check if DBeaver is installed
which dbeaver
dbeaver --version

# Set custom path
export DBEAVER_PATH="/path/to/dbeaver"
dbeaver-mcp-server
```

### DBeaver Configuration Issues
- Ensure DBeaver is installed and has been run at least once
- Verify connections work in DBeaver GUI
- Check file permissions on DBeaver config directory
- Restart DBeaver after making configuration changes

### Connection Authentication
- Verify connection credentials haven't expired
- Check if database server is accessible
- Ensure firewall settings allow database connections

## Query Execution Issues

### Query Syntax Errors
- Test queries directly in DBeaver first
- Verify query syntax for your specific database type
- Check for database-specific SQL dialects

### Timeout Issues
```bash
# Increase timeout
export DBEAVER_TIMEOUT=120000
dbeaver-mcp-server

# Or in Claude Desktop config
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server",
      "env": {
        "DBEAVER_TIMEOUT": "120000"
      }
    }
  }
}
```

### Large Result Sets
- Use LIMIT clauses for large queries
- Consider pagination for large datasets
- Enable debug mode to monitor query performance

## Platform-Specific Issues

### Windows
- Ensure DBeaver is in PATH or set DBEAVER_PATH
- Use PowerShell as Administrator for global installation
- Check Windows Defender firewall settings
- Verify DBeaver executable path: `C:\Program Files\DBeaver\dbeaver.exe`

### macOS
- May need to grant terminal permissions to access DBeaver
- Check System Preferences > Security & Privacy > Privacy > Full Disk Access
- DBeaver path: `/Applications/DBeaver.app/Contents/MacOS/dbeaver`
- Use Homebrew for Node.js: `brew install node`

### Linux
- Check AppImage vs package installation paths
- Ensure execute permissions: `chmod +x dbeaver-mcp-server`
- Install via package manager: `sudo apt install nodejs npm` (Ubuntu/Debian)
- DBeaver AppImage path: `~/Downloads/DBeaver.AppImage`

## MCP Client Issues

### Claude Desktop
- Restart Claude Desktop after configuration changes
- Check config file syntax (valid JSON)
- Verify the command path is correct
- Enable debug mode for troubleshooting

### Cursor IDE
- Check MCP server configuration in settings
- Restart Cursor after configuration changes
- Verify the server is running and accessible

## Debugging

### Enable Debug Mode
```bash
# Command line
DBEAVER_DEBUG=true dbeaver-mcp-server

# Claude Desktop config
{
  "mcpServers": {
    "dbeaver": {
      "command": "dbeaver-mcp-server",
      "env": {
        "DBEAVER_DEBUG": "true"
      }
    }
  }
}
```

### Check Logs
- Look for error messages and stack traces
- Monitor query execution times
- Check for connection failures
- Verify MCP protocol communication

### Test MCP Server
```bash
# Test basic functionality
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | dbeaver-mcp-server

# Test tools list
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | dbeaver-mcp-server
```

## Performance Issues

### Slow Query Execution
- Check database server performance
- Optimize query syntax
- Use appropriate indexes
- Consider query timeout settings

### Memory Usage
- Monitor Node.js memory usage
- Close unused database connections
- Restart the MCP server periodically

## Getting Help

### Before Asking for Help
1. Check this troubleshooting guide
2. Enable debug mode and check logs
3. Test with a simple query in DBeaver
4. Verify your Node.js and DBeaver versions

### Resources
- [Installation Guide](getting-started/installation.md)
- [Configuration Guide](getting-started/configuration.md)
- [GitHub Issues](https://github.com/srthkdev/dbeaver-mcp-server/issues)
- [NPM Package](https://www.npmjs.com/package/dbeaver-mcp-server)

### Reporting Issues
When reporting issues, please include:
- Operating system and version
- Node.js version (`node --version`)
- DBeaver version (`dbeaver --version`)
- Error messages and logs
- Steps to reproduce the issue
- Expected vs actual behavior
