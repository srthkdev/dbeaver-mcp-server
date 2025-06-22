import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DBeaverConfigParser } from './config-parser.js';
import { DBeaverClient } from './dbeaver-client.js';
import { DBeaverConnection, QueryResult, ExportOptions } from './types.js';
import { validateQuery, sanitizeConnectionId, formatError } from './utils.js';

class DBeaverMCPServer {
  private server: Server;
  private configParser: DBeaverConfigParser;
  private dbeaverClient: DBeaverClient;
  private debug: boolean;

  constructor() {
    this.debug = process.env.DBEAVER_DEBUG === 'true';
    
    this.server = new Server(
      {
        name: 'dbeaver-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.configParser = new DBeaverConfigParser({
      debug: this.debug,
      timeout: parseInt(process.env.DBEAVER_TIMEOUT || '30000'),
      executablePath: process.env.DBEAVER_PATH
    });

    this.dbeaverClient = new DBeaverClient(
      process.env.DBEAVER_PATH,
      parseInt(process.env.DBEAVER_TIMEOUT || '30000'),
      this.debug
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private log(message: string, level: 'info' | 'error' | 'debug' = 'info') {
    if (level === 'debug' && !this.debug) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (level === 'error') {
      console.error(`${prefix} ${message}`);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }

  private setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      this.log(`Uncaught exception: ${error.message}`, 'error');
      if (this.debug) {
        this.log(error.stack || '', 'debug');
      }
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
      if (this.debug) {
        this.log(String(reason), 'debug');
      }
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'list_connections',
          description: 'List all available DBeaver database connections',
          inputSchema: {
            type: 'object',
            properties: {
              includeDetails: {
                type: 'boolean',
                description: 'Include detailed connection information',
                default: false
              }
            }
          },
        },
        {
          name: 'get_connection_info',
          description: 'Get detailed information about a specific DBeaver connection',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
            },
            required: ['connectionId'],
          },
        },
        {
          name: 'execute_query',
          description: 'Execute a SQL query on a specific DBeaver connection',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection to use',
              },
              query: {
                type: 'string',
                description: 'The SQL query to execute',
              },
              maxRows: {
                type: 'number',
                description: 'Maximum number of rows to return (default: 1000)',
                default: 1000
              }
            },
            required: ['connectionId', 'query'],
          },
        },
        {
          name: 'get_table_schema',
          description: 'Get schema information for a specific table',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
              tableName: {
                type: 'string',
                description: 'The name of the table to describe',
              },
              includeIndexes: {
                type: 'boolean',
                description: 'Include index information',
                default: true
              }
            },
            required: ['connectionId', 'tableName'],
          },
        },
        {
          name: 'export_data',
          description: 'Export query results to various formats',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
              query: {
                type: 'string',
                description: 'The SQL query to execute for export',
              },
              format: {
                type: 'string',
                enum: ['csv', 'json', 'xml', 'excel'],
                description: 'Export format',
                default: 'csv'
              },
              includeHeaders: {
                type: 'boolean',
                description: 'Include column headers in export',
                default: true
              },
              maxRows: {
                type: 'number',
                description: 'Maximum number of rows to export',
                default: 10000
              }
            },
            required: ['connectionId', 'query'],
          },
        },
        {
          name: 'test_connection',
          description: 'Test connectivity to a DBeaver connection',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection to test',
              },
            },
            required: ['connectionId'],
          },
        },
        {
          name: 'get_database_stats',
          description: 'Get statistics and information about a database',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
            },
            required: ['connectionId'],
          },
        },
        {
          name: 'list_tables',
          description: 'List all tables in a database',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
              schema: {
                type: 'string',
                description: 'Specific schema to list tables from (optional)',
              },
              includeViews: {
                type: 'boolean',
                description: 'Include views in the results',
                default: false
              }
            },
            required: ['connectionId'],
          },
        }
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        this.log(`Executing tool: ${name} with args: ${JSON.stringify(args)}`, 'debug');
        
        switch (name) {
          case 'list_connections':
            return await this.handleListConnections(args as { includeDetails?: boolean });
            
          case 'get_connection_info':
            return await this.handleGetConnectionInfo(args as { connectionId: string });
            
          case 'execute_query':
            return await this.handleExecuteQuery(args as { 
              connectionId: string; 
              query: string; 
              maxRows?: number 
            });
            
          case 'get_table_schema':
            return await this.handleGetTableSchema(args as { 
              connectionId: string; 
              tableName: string; 
              includeIndexes?: boolean 
            });
            
          case 'export_data':
            return await this.handleExportData(args as { 
              connectionId: string; 
              query: string; 
              format?: string; 
              includeHeaders?: boolean; 
              maxRows?: number 
            });
            
          case 'test_connection':
            return await this.handleTestConnection(args as { connectionId: string });
            
          case 'get_database_stats':
            return await this.handleGetDatabaseStats(args as { connectionId: string });
            
          case 'list_tables':
            return await this.handleListTables(args as { 
              connectionId: string; 
              schema?: string; 
              includeViews?: boolean 
            });
            
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        this.log(`Tool execution failed: ${error}`, 'error');
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${formatError(error)}`
        );
      }
    });
  }

  private async handleListConnections(args: { includeDetails?: boolean }) {
    const connections = await this.configParser.parseConnections();
    
    if (args.includeDetails) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(connections, null, 2),
        }],
      };
    }
    
    const simplified = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      driver: conn.driver,
      host: conn.host,
      database: conn.database,
      folder: conn.folder
    }));
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(simplified, null, 2),
      }],
    };
  }

  private async handleGetConnectionInfo(args: { connectionId: string }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const connection = await this.configParser.getConnection(connectionId);
    
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(connection, null, 2),
      }],
    };
  }

  private async handleExecuteQuery(args: { 
    connectionId: string; 
    query: string; 
    maxRows?: number 
  }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const query = args.query.trim();
    const maxRows = args.maxRows || 1000;
    
    // Validate query
    const validationError = validateQuery(query);
    if (validationError) {
      throw new McpError(ErrorCode.InvalidParams, validationError);
    }
    
    const connection = await this.configParser.getConnection(connectionId);
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }
    
    // Add LIMIT clause if not present and it's a SELECT query
    let finalQuery = query;
    if (query.toLowerCase().trimStart().startsWith('select') && 
        !query.toLowerCase().includes('limit')) {
      finalQuery = `${query} LIMIT ${maxRows}`;
    }
    
    const result = await this.dbeaverClient.executeQuery(connection, finalQuery);
    
    const response = {
      query: finalQuery,
      connection: connection.name,
      executionTime: result.executionTime,
      rowCount: result.rowCount,
      columns: result.columns,
      rows: result.rows,
      truncated: result.rows.length >= maxRows
    };
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(response, null, 2),
      }],
    };
  }

  private async handleGetTableSchema(args: { 
    connectionId: string; 
    tableName: string; 
    includeIndexes?: boolean 
  }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const connection = await this.configParser.getConnection(connectionId);
    
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }
    
    const schema = await this.dbeaverClient.getTableSchema(connection, args.tableName);
    
    if (!args.includeIndexes) {
      (schema as any).indexes = undefined;
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(schema, null, 2),
      }],
    };
  }

  private async handleExportData(args: { 
    connectionId: string; 
    query: string; 
    format?: string; 
    includeHeaders?: boolean; 
    maxRows?: number 
  }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const connection = await this.configParser.getConnection(connectionId);
    
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }
    
    const options: ExportOptions = {
      format: (args.format as any) || 'csv',
      includeHeaders: args.includeHeaders !== false,
      maxRows: args.maxRows || 10000
    };
    
    const exportPath = await this.dbeaverClient.exportData(connection, args.query, options);
    
    return {
      content: [{
        type: 'text' as const,
        text: `Data exported successfully to: ${exportPath}`,
      }],
    };
  }

  private async handleTestConnection(args: { connectionId: string }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const connection = await this.configParser.getConnection(connectionId);
    
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }
    
    const testResult = await this.dbeaverClient.testConnection(connection);
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(testResult, null, 2),
      }],
    };
  }

  private async handleGetDatabaseStats(args: { connectionId: string }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const connection = await this.configParser.getConnection(connectionId);
    
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }
    
    const stats = await this.dbeaverClient.getDatabaseStats(connection);
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(stats, null, 2),
      }],
    };
  }

  private async handleListTables(args: { 
    connectionId: string; 
    schema?: string; 
    includeViews?: boolean 
  }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const connection = await this.configParser.getConnection(connectionId);
    
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }
    
    const tables = await this.dbeaverClient.listTables(
      connection, 
      args.schema, 
      args.includeViews || false
    );
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(tables, null, 2),
      }],
    };
  }

  async run() {
    try {
      // Validate DBeaver workspace
      if (!this.configParser.isWorkspaceValid()) {
        throw new Error('DBeaver workspace not found. Please run DBeaver at least once to create the workspace.');
      }

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.log('DBeaver MCP server started successfully');
      
      if (this.debug) {
        const debugInfo = this.configParser.getDebugInfo();
        this.log(`Debug info: ${JSON.stringify(debugInfo, null, 2)}`, 'debug');
      }
      
    } catch (error) {
      this.log(`Failed to start server: ${formatError(error)}`, 'error');
      process.exit(1);
    }
  }
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
DBeaver MCP Server v1.0.0

Usage: dbeaver-mcp-server [options]

Options:
  -h, --help     Show this help message
  --version      Show version information
  --debug        Enable debug logging

Environment Variables:
  DBEAVER_PATH      Path to DBeaver executable
  DBEAVER_TIMEOUT   Query timeout in milliseconds (default: 30000)
  DBEAVER_DEBUG     Enable debug logging (true/false)

For more information, visit: https://github.com/yourusername/dbeaver-mcp-server
`);
  process.exit(0);
}

if (process.argv.includes('--version')) {
  console.log('1.0.0');
  process.exit(0);
}

// Start the server
const server = new DBeaverMCPServer();
server.run().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});