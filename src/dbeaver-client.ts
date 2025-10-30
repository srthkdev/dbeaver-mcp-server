import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import csv from 'csv-parser';
import { Client } from 'pg';
import { 
  DBeaverConnection, 
  QueryResult, 
  SchemaInfo, 
  ExportOptions, 
  ConnectionTest,
  DatabaseStats 
} from './types.js';
import { findDBeaverExecutable, getTestQuery, parseVersionFromResult, buildSchemaQuery, buildListTablesQuery } from './utils.js';

export class DBeaverClient {
  private executablePath: string;
  private timeout: number;
  private debug: boolean;

  constructor(executablePath?: string, timeout: number = 30000, debug: boolean = false) {
    this.executablePath = executablePath || findDBeaverExecutable();
    this.timeout = timeout;
    this.debug = debug;
  }

  async executeQuery(connection: DBeaverConnection, query: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      // Use native database tools instead of DBeaver command line
      const result = await this.executeWithNativeTool(connection, query);
      result.executionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  async testConnection(connection: DBeaverConnection): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Simple test query based on database type
      const testQuery = this.getTestQuery(connection.driver);
      const result = await this.executeQuery(connection, testQuery);
      
      return {
        connectionId: connection.id,
        success: true,
        responseTime: Date.now() - startTime,
        databaseVersion: this.extractVersionFromResult(result)
      };
    } catch (error) {
      return {
        connectionId: connection.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        responseTime: Date.now() - startTime
      };
    }
  }

  async getTableSchema(connection: DBeaverConnection, tableName: string): Promise<SchemaInfo> {
    const schemaQuery = this.buildSchemaQuery(connection.driver, tableName);
    const result = await this.executeQuery(connection, schemaQuery);
    
    return this.parseSchemaResult(result, tableName);
  }

  async exportData(
    connection: DBeaverConnection, 
    query: string, 
    options: ExportOptions
  ): Promise<string> {
    const tempDir = os.tmpdir();
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sqlFile = path.join(tempDir, `${exportId}.sql`);
    const outputFile = path.join(tempDir, `${exportId}_output.${options.format || 'csv'}`);

    try {
      // Write query to temporary file
      fs.writeFileSync(sqlFile, query, 'utf-8');

      // Build DBeaver command arguments
      const args = [
        '-nosplash',
        '-reuseWorkspace',
        '-con', connection.id,
        '-f', sqlFile,
        '-o', outputFile,
        '-of', options.format || 'csv',
        '-quit'
      ];

      await this.executeDBeaver(args);

      // Optionally, you could check if the file exists and return the path
      if (!fs.existsSync(outputFile)) {
        throw new Error('Export failed: output file not found');
      }

      return outputFile;
    } catch (error) {
      throw new Error(`Export failed: ${error}`);
    } finally {
      // Cleanup the SQL file, but keep the output file for the user
      this.cleanupFiles([sqlFile]);
    }
  }

  private async executeWithNativeTool(connection: DBeaverConnection, query: string): Promise<QueryResult> {
    const driver = connection.driver.toLowerCase();
    
    if (driver.includes('sqlite')) {
      return this.executeSQLiteQuery(connection, query);
    } else if (driver.includes('postgres')) {
      return this.executePostgreSQLQuery(connection, query);
    } else {
      // For unsupported drivers, return a helpful error instead of crashing
      throw new Error(`Database driver "${driver}" is not yet supported for direct query execution. Supported drivers: SQLite, PostgreSQL. Please use DBeaver GUI for this connection type.`);
    }
  }

  private async executeSQLiteQuery(connection: DBeaverConnection, query: string): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      const dbPath = connection.properties?.database || connection.database;
      if (!dbPath) {
        reject(new Error('SQLite database path not found'));
        return;
      }

      const proc = spawn('sqlite3', [dbPath, '-header', '-csv'], { stdio: ['pipe', 'pipe', 'pipe'] });
      
      let output = '';
      let error = '';
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`SQLite error: ${error}`));
          return;
        }
        
        const lines = output.trim().split('\n');
        if (lines.length === 0) {
          resolve({ columns: [], rows: [], rowCount: 0, executionTime: 0 });
          return;
        }
        
        const columns = lines[0].split(',');
        const rows = lines.slice(1).map(line => line.split(','));
        
        resolve({ columns, rows, rowCount: rows.length, executionTime: 0 });
      });
      
      proc.stdin.write(query);
      proc.stdin.end();
    });
  }

  private async executePostgreSQLQuery(connection: DBeaverConnection, query: string): Promise<QueryResult> {
    const host = connection.host || connection.properties?.host || 'localhost';
    const port = connection.port || (connection.properties?.port ? parseInt(connection.properties.port) : 5432);
    const database = connection.database || connection.properties?.database || 'postgres';
    const user = connection.user || connection.properties?.user || process.env.PGUSER || 'postgres';
    const password = connection.properties?.password || process.env.PGPASSWORD;

    // SSL handling
    const sslModeRaw = connection.properties?.['ssl.mode'] || connection.properties?.['sslmode'] || connection.properties?.['ssl'];
    const sslMode = String(sslModeRaw ?? '').toLowerCase();
    const sslRootCert = connection.properties?.['sslrootcert'] || connection.properties?.['ssl.root.cert'] || connection.properties?.['sslRootCert'];
    const sslCert = connection.properties?.['sslcert'] || connection.properties?.['ssl.cert'] || connection.properties?.['sslCert'];
    const sslKey = connection.properties?.['sslkey'] || connection.properties?.['ssl.key'] || connection.properties?.['sslKey'];

    let ssl: any = undefined;
    const requireSsl = ['require', 'verify-ca', 'verify-full', 'true', '1'].includes(sslMode);
    const verifyModes = ['verify-ca', 'verify-full'];
    const disableSsl = ['disable', 'false', '0'].includes(sslMode);
    if (requireSsl) {
      const sslObj: any = {};
      try {
        if (sslRootCert && fs.existsSync(String(sslRootCert))) sslObj.ca = fs.readFileSync(String(sslRootCert)).toString();
        if (sslCert && fs.existsSync(String(sslCert))) sslObj.cert = fs.readFileSync(String(sslCert)).toString();
        if (sslKey && fs.existsSync(String(sslKey))) sslObj.key = fs.readFileSync(String(sslKey)).toString();
      } catch (e) {
        // ignore errors, we'll set a reasonable default below
      }
      const hasCa = typeof sslObj.ca === 'string' && sslObj.ca.length > 0;
      if (verifyModes.includes(sslMode)) {
        // Enforce certificate verification. If no custom CA is provided, fallback to system trust store.
        sslObj.rejectUnauthorized = true;
        if (this.debug && !hasCa) {
          // eslint-disable-next-line no-console
          console.warn('sslMode set to verify-ca/verify-full but no sslrootcert provided; using system CA store');
        }
      } else {
        // "require" mode: encrypt without verification
        sslObj.rejectUnauthorized = false;
      }
      ssl = sslObj;
    } else if (disableSsl) {
      ssl = false;
    }

    const client = new Client({ host, port, database, user, password, ssl });
    try {
      await client.connect();
      const res = await client.query(query);
      const columns: string[] = (res.fields || []).map((f: any) => f.name as string);
      const rows: any[][] = (res.rows || []).map((r: any) => columns.map((c: string) => r[c]));
      return { columns, rows, rowCount: typeof res.rowCount === 'number' ? res.rowCount : rows.length, executionTime: 0 };
    } finally {
      try {
        await client.end();
      } catch (closeError) {
        // ALWAYS log connection cleanup failures - they indicate resource leaks
        console.error('Failed to close PostgreSQL connection:', {
          error: closeError instanceof Error ? closeError.message : String(closeError),
          host,
          database
        });
      }
    }
  }

  private async executeDBeaver(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.executablePath, args, { stdio: this.debug ? 'inherit' : 'ignore' });
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error(`DBeaver execution timed out after ${this.timeout}ms`));
      }, this.timeout);
      
      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
      
      proc.on('exit', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`DBeaver exited with code ${code}`));
        }
      });
    });
  }

  private cleanupFiles(files: string[]): void {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }

  private async parseCSVOutput(filePath: string): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      let columns: string[] = [];
      let rowCount = 0;
      
      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        reject(new Error(`Output file not found: ${filePath}`));
        return;
      }
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
          columns = headers;
        })
        .on('data', (data) => {
          rows.push(Object.values(data));
          rowCount++;
        })
        .on('end', () => {
          resolve({ columns, rows, rowCount, executionTime: 0 });
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  private getTestQuery(driver: string): string {
    // Delegate to utils
    return getTestQuery(driver);
  }

  private extractVersionFromResult(result: any): string | undefined {
    return parseVersionFromResult(result);
  }

  private buildSchemaQuery(driver: string, tableName: string): string {
    return buildSchemaQuery(driver, tableName);
  }

  private parseSchemaResult(result: any, tableName: string): SchemaInfo {
    const columns: any[] = [];
    
    if (result.rows && result.columns) {
      // Parse each row as a column definition
      result.rows.forEach((row: any[]) => {
        const columnInfo: any = {
          name: '',
          type: 'string',
          nullable: true,
          isPrimaryKey: false,
          isAutoIncrement: false
        };
        
        // Map columns based on the query result structure
        result.columns.forEach((colName: string, idx: number) => {
          const value = row[idx];
          
          switch (colName.toLowerCase()) {
            case 'column_name':
            case 'name':
              columnInfo.name = value || '';
              break;
            case 'data_type':
            case 'type':
              columnInfo.type = value || 'string';
              break;
            case 'is_nullable':
            case 'nullable':
              columnInfo.nullable = value === 'YES' || value === 'Y' || value === true;
              break;
            case 'column_default':
            case 'default':
              columnInfo.defaultValue = value;
              break;
            case 'column_key':
            case 'key':
              columnInfo.isPrimaryKey = value === 'PRI' || value === 'PRIMARY';
              break;
            case 'extra':
              columnInfo.isAutoIncrement = value && value.toLowerCase().includes('auto_increment');
              break;
            case 'character_maximum_length':
            case 'length':
              columnInfo.length = parseInt(value) || undefined;
              break;
            case 'numeric_precision':
            case 'precision':
              columnInfo.precision = parseInt(value) || undefined;
              break;
            case 'numeric_scale':
            case 'scale':
              columnInfo.scale = parseInt(value) || undefined;
              break;
          }
        });
        
        if (columnInfo.name) {
          columns.push(columnInfo);
        }
      });
    }
    
    return {
      tableName,
      columns,
      indexes: [],
      constraints: []
    };
  }

  async getDatabaseStats(connection: DBeaverConnection): Promise<DatabaseStats> {
    const startTime = Date.now();
    
    try {
      // Get table count
      const tables = await this.listTables(connection, undefined, true);
      const tableCount = tables.length;
      
      // Get server version
      const versionQuery = this.getTestQuery(connection.driver);
      const versionResult = await this.executeQuery(connection, versionQuery);
      const serverVersion = this.extractVersionFromResult(versionResult) || 'Unknown';
      
      return {
        connectionId: connection.id,
        tableCount,
        totalSize: 'Unknown', // Would need specific queries per database type
        connectionTime: Date.now() - startTime,
        serverVersion
      };
    } catch (error) {
      return {
        connectionId: connection.id,
        tableCount: 0,
        totalSize: 'Unknown',
        connectionTime: Date.now() - startTime,
        serverVersion: 'Unknown'
      };
    }
  }

  async listTables(connection: DBeaverConnection, schema?: string, includeViews: boolean = false): Promise<any[]> {
    try {
      const query = buildListTablesQuery(connection.driver, schema, includeViews);
      const result = await this.executeQuery(connection, query);
      
      // Convert result to table objects
      return result.rows.map(row => {
        const tableObj: any = {};
        result.columns.forEach((col, idx) => {
          tableObj[col] = row[idx];
        });
        return tableObj;
      });
    } catch (error) {
      if (this.debug) {
        console.error(`Failed to list tables: ${error}`);
      }
      // Return empty array instead of crashing
      return [];
    }
  }
}