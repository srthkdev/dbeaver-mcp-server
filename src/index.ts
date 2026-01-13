import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DBeaverConfigParser } from './config-parser.js';
import { DBeaverClient } from './dbeaver-client.js';
import { DBeaverConnection, QueryResult, ExportOptions, BusinessInsight, TableResource } from './types.js';
import { validateQuery, sanitizeConnectionId, formatError, convertToCSV } from './utils.js';
// CSV functionality will be handled in utils
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = packageJson.version;

class DBeaverMCPServer {
  private server: Server;
  private configParser: DBeaverConfigParser;
  private dbeaverClient: DBeaverClient;
  private debug: boolean;
  private insights: BusinessInsight[] = [];
  private insightsFile: string;

  constructor() {
    this.debug = process.env.DBEAVER_DEBUG === 'true';
    this.insightsFile = path.join(os.tmpdir(), 'dbeaver-mcp-insights.json');

    this.server = new Server(
      {
        name: 'dbeaver-mcp-server',
        version: VERSION,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.configParser = new DBeaverConfigParser({
      debug: this.debug,
      timeout: parseInt(process.env.DBEAVER_TIMEOUT || '30000'),
      executablePath: process.env.DBEAVER_PATH,
      workspacePath: process.env.DBEAVER_WORKSPACE
    });

    this.dbeaverClient = new DBeaverClient(
      process.env.DBEAVER_PATH,
      parseInt(process.env.DBEAVER_TIMEOUT || '30000'),
      this.debug,
      process.env.DBEAVER_WORKSPACE || this.configParser.getWorkspacePath()
    );

    this.loadInsights();
    this.setupResourceHandlers();
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

  private loadInsights() {
    try {
      if (fs.existsSync(this.insightsFile)) {
        const data = fs.readFileSync(this.insightsFile, 'utf-8');
        this.insights = JSON.parse(data);
      }
    } catch (error) {
      this.log(`Failed to load insights: ${error}`, 'debug');
      this.insights = [];
    }
  }

  private saveInsights() {
    try {
      fs.writeFileSync(this.insightsFile, JSON.stringify(this.insights, null, 2));
    } catch (error) {
      this.log(`Failed to save insights: ${error}`, 'error');
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

  private setupResourceHandlers() {
    // List all available database resources (table schemas)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const connections = await this.configParser.parseConnections();
        const resources: any[] = [];

        for (const connection of connections) {
          try {
            const tables = await this.dbeaverClient.listTables(connection, undefined, false);

            for (const table of tables) {
              const tableName = typeof table === 'string' ? table : table.name || table.table_name;
              if (tableName) {
                resources.push({
                  uri: `dbeaver://${connection.id}/${tableName}/schema`,
                  mimeType: "application/json",
                  name: `"${tableName}" schema (${connection.name})`,
                  description: `Schema information for table ${tableName} in ${connection.name}`,
                });
              }
            }
          } catch (error) {
            this.log(`Failed to list tables for connection ${connection.name}: ${error}`, 'debug');
          }
        }

        return { resources };
      } catch (error) {
        this.log(`Failed to list resources: ${error}`, 'error');
        return { resources: [] };
      }
    });

    // Get schema information for a specific table
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const uri = new URL(request.params.uri);
        const pathParts = uri.pathname.split('/').filter(p => p);

        if (pathParts.length < 2 || pathParts[pathParts.length - 1] !== 'schema') {
          throw new Error("Invalid resource URI format");
        }

        const connectionId = uri.hostname;
        const tableName = pathParts[pathParts.length - 2];

        const connection = await this.configParser.getConnection(connectionId);
        if (!connection) {
          throw new Error(`Connection not found: ${connectionId}`);
        }

        const schema = await this.dbeaverClient.getTableSchema(connection, tableName);

        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(ErrorCode.InvalidParams, `Failed to read resource: ${formatError(error)}`);
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
          description: 'Execute a SQL query on a specific DBeaver connection (read-only queries)',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection to use',
              },
              query: {
                type: 'string',
                description: 'The SQL query to execute (SELECT statements only)',
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
          name: 'write_query',
          description: 'Execute INSERT, UPDATE, or DELETE queries on a specific DBeaver connection',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection to use',
              },
              query: {
                type: 'string',
                description: 'The SQL query to execute (INSERT, UPDATE, DELETE)',
              },
            },
            required: ['connectionId', 'query'],
          },
        },
        {
          name: 'create_table',
          description: 'Create new tables in the database',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
              query: {
                type: 'string',
                description: 'CREATE TABLE statement',
              },
            },
            required: ['connectionId', 'query'],
          },
        },
        {
          name: 'alter_table',
          description: 'Modify existing table schema (add columns, rename tables, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
              query: {
                type: 'string',
                description: 'ALTER TABLE statement',
              },
            },
            required: ['connectionId', 'query'],
          },
        },
        {
          name: 'drop_table',
          description: 'Remove a table from the database with safety confirmation',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
              tableName: {
                type: 'string',
                description: 'Name of the table to drop',
              },
              confirm: {
                type: 'boolean',
                description: 'Safety confirmation flag (must be true)',
              },
            },
            required: ['connectionId', 'tableName', 'confirm'],
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
          description: 'Export query results to various formats (CSV, JSON, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'The ID or name of the DBeaver connection',
              },
              query: {
                type: 'string',
                description: 'The SQL query to execute for export (SELECT only)',
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
        },
        {
          name: 'append_insight',
          description: 'Add a business insight or analysis note to the memo',
          inputSchema: {
            type: 'object',
            properties: {
              insight: {
                type: 'string',
                description: 'The business insight or analysis note to store',
              },
              connection: {
                type: 'string',
                description: 'Optional connection ID to associate with this insight',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tags to categorize the insight',
              },
            },
            required: ['insight'],
          },
        },
        {
          name: 'list_insights',
          description: 'List all stored business insights and analysis notes',
          inputSchema: {
            type: 'object',
            properties: {
              connection: {
                type: 'string',
                description: 'Filter insights by connection ID (optional)',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter insights by tags (optional)',
              },
            },
          },
        },
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

          case 'write_query':
            return await this.handleWriteQuery(args as {
              connectionId: string;
              query: string;
            });

          case 'create_table':
            return await this.handleCreateTable(args as {
              connectionId: string;
              query: string;
            });

          case 'alter_table':
            return await this.handleAlterTable(args as {
              connectionId: string;
              query: string;
            });

          case 'drop_table':
            return await this.handleDropTable(args as {
              connectionId: string;
              tableName: string;
              confirm: boolean
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

          case 'append_insight':
            return await this.handleAppendInsight(args as {
              insight: string;
              connection?: string;
              tags?: string[]
            });

          case 'list_insights':
            return await this.handleListInsights(args as {
              connection?: string;
              tags?: string[]
            });

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
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

    // Add LIMIT/TOP clause if not present and it's a SELECT query
    let finalQuery = query;
    const lowerQuery = query.toLowerCase().trimStart();

    if (lowerQuery.startsWith('select')) {
      const driver = connection.driver.toLowerCase();
      const isSqlServer = driver.includes('mssql') || driver.includes('sqlserver') || driver.includes('microsoft');

      if (isSqlServer) {
        if (!lowerQuery.includes('top ') && !lowerQuery.includes('offset ') && !lowerQuery.includes('fetch next')) {
          // Simple injection of TOP for SQL Server
          finalQuery = query.replace(/^select/i, `SELECT TOP ${maxRows}`);
        }
      } else {
        if (!lowerQuery.includes('limit')) {
          // Strip trailing semicolons so we don't produce invalid SQL like `SELECT 1; LIMIT 10`
          const withoutTrailingSemicolon = query.replace(/;+\s*$/g, '');
          finalQuery = `${withoutTrailingSemicolon} LIMIT ${maxRows}`;
        }
      }
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

  private async handleWriteQuery(args: { connectionId: string; query: string }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const query = args.query.trim();

    // Validate query type
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.startsWith('select')) {
      throw new McpError(ErrorCode.InvalidParams, 'Use execute_query for SELECT operations');
    }

    if (!(lowerQuery.startsWith('insert') || lowerQuery.startsWith('update') || lowerQuery.startsWith('delete'))) {
      throw new McpError(ErrorCode.InvalidParams, 'Only INSERT, UPDATE, or DELETE operations are allowed with write_query');
    }

    // Additional validation
    const validationError = validateQuery(query);
    if (validationError) {
      throw new McpError(ErrorCode.InvalidParams, validationError);
    }

    const connection = await this.configParser.getConnection(connectionId);
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }

    const result = await this.dbeaverClient.executeQuery(connection, query);

    const response = {
      query: query,
      connection: connection.name,
      executionTime: result.executionTime,
      affectedRows: result.rowCount,
      success: true
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(response, null, 2),
      }],
    };
  }

  private async handleCreateTable(args: { connectionId: string; query: string }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const query = args.query.trim();

    if (!query.toLowerCase().startsWith('create table')) {
      throw new McpError(ErrorCode.InvalidParams, 'Only CREATE TABLE statements are allowed');
    }

    const connection = await this.configParser.getConnection(connectionId);
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }

    const result = await this.dbeaverClient.executeQuery(connection, query);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Table created successfully',
          executionTime: result.executionTime
        }, null, 2),
      }],
    };
  }

  private async handleAlterTable(args: { connectionId: string; query: string }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const query = args.query.trim();

    if (!query.toLowerCase().startsWith('alter table')) {
      throw new McpError(ErrorCode.InvalidParams, 'Only ALTER TABLE statements are allowed');
    }

    const connection = await this.configParser.getConnection(connectionId);
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }

    const result = await this.dbeaverClient.executeQuery(connection, query);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Table altered successfully',
          executionTime: result.executionTime
        }, null, 2),
      }],
    };
  }

  private async handleDropTable(args: { connectionId: string; tableName: string; confirm: boolean }) {
    const connectionId = sanitizeConnectionId(args.connectionId);
    const tableName = args.tableName;

    if (!tableName) {
      throw new McpError(ErrorCode.InvalidParams, 'Table name is required');
    }

    if (!args.confirm) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            message: 'Safety confirmation required. Set confirm=true to proceed with dropping the table.'
          }, null, 2),
        }],
      };
    }

    const connection = await this.configParser.getConnection(connectionId);
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }

    // Check if table exists first
    try {
      await this.dbeaverClient.getTableSchema(connection, tableName);
    } catch (error) {
      throw new McpError(ErrorCode.InvalidParams, `Table '${tableName}' does not exist or cannot be accessed`);
    }

    const dropQuery = `DROP TABLE "${tableName}"`;
    const result = await this.dbeaverClient.executeQuery(connection, dropQuery);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Table '${tableName}' dropped successfully`,
          executionTime: result.executionTime
        }, null, 2),
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
    const query = args.query.trim();

    // Validate query - only SELECT queries for export
    if (!query.toLowerCase().trimStart().startsWith('select')) {
      throw new McpError(ErrorCode.InvalidParams, 'Only SELECT queries are allowed for export');
    }

    const connection = await this.configParser.getConnection(connectionId);
    if (!connection) {
      throw new McpError(ErrorCode.InvalidParams, `Connection not found: ${connectionId}`);
    }

    const maxRows = args.maxRows || 10000;
    const format = args.format || 'csv';

    // Add LIMIT clause if not present
    let finalQuery = query;
    if (!query.toLowerCase().includes('limit')) {
      finalQuery = `${query} LIMIT ${maxRows}`;
    }

    const result = await this.dbeaverClient.executeQuery(connection, finalQuery);

    if (format === 'csv') {
      const csvData = convertToCSV(result.columns, result.rows);
      return {
        content: [{
          type: 'text' as const,
          text: csvData,
        }],
      };
    } else if (format === 'json') {
      const jsonData = result.rows.map(row => {
        const obj: any = {};
        result.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(jsonData, null, 2),
        }],
      };
    } else {
      throw new McpError(ErrorCode.InvalidParams, `Unsupported export format: ${format}. Use 'csv' or 'json'`);
    }
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

  private async handleAppendInsight(args: { insight: string; connection?: string; tags?: string[] }) {
    if (!args.insight || args.insight.trim().length === 0) {
      throw new McpError(ErrorCode.InvalidParams, 'Insight text is required');
    }

    const newInsight: BusinessInsight = {
      id: Date.now(),
      insight: args.insight.trim(),
      created_at: new Date().toISOString(),
      connection: args.connection,
      tags: args.tags || []
    };

    this.insights.push(newInsight);
    this.saveInsights();

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Insight added successfully',
          id: newInsight.id
        }, null, 2),
      }],
    };
  }

  private async handleListInsights(args: { connection?: string; tags?: string[] }) {
    let filteredInsights = [...this.insights];

    if (args.connection) {
      filteredInsights = filteredInsights.filter(insight =>
        insight.connection === args.connection
      );
    }

    if (args.tags && args.tags.length > 0) {
      filteredInsights = filteredInsights.filter(insight =>
        insight.tags && args.tags!.some(tag => insight.tags!.includes(tag))
      );
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(filteredInsights, null, 2),
      }],
    };
  }

  async run() {
    try {
      // Validate DBeaver workspace
      if (!this.configParser.isWorkspaceValid()) {
        this.log('DBeaver workspace not found. Please run DBeaver at least once to create the workspace.', 'error');
        this.log('The server will start but will not be able to access any database connections.', 'error');
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
  console.error(`
DBeaver MCP Server v${VERSION}

Usage: dbeaver-mcp-server [options]

Options:
  -h, --help     Show this help message
  --version      Show version information
  --debug        Enable debug logging

Environment Variables:
  DBEAVER_PATH      Path to DBeaver executable
  DBEAVER_TIMEOUT   Query timeout in milliseconds (default: 30000)
  DBEAVER_DEBUG     Enable debug logging (true/false)

Features:
  - Universal database support via DBeaver connections
  - Read and write operations with safety checks
  - Schema introspection and table management
  - Data export in multiple formats
  - Business insights tracking
  - Resource-based schema browsing

For more information, visit: https://github.com/srthkdev/dbeaver-mcp-server
`);
  process.exit(0);
}

if (process.argv.includes('--version')) {
  console.error(VERSION);
  process.exit(0);
}

// Start the server
const server = new DBeaverMCPServer();
server.run().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
