import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import csv from 'csv-parser';
import { 
  DBeaverConnection, 
  QueryResult, 
  SchemaInfo, 
  ExportOptions, 
  ConnectionTest,
  DatabaseStats 
} from './types.js';
import { findDBeaverExecutable } from './utils.js';

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
    const tempDir = os.tmpdir();
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sqlFile = path.join(tempDir, `${queryId}.sql`);
    const outputFile = path.join(tempDir, `${queryId}_output.csv`);

    try {
      // Write query to temporary file
      fs.writeFileSync(sqlFile, query, 'utf-8');

      // Execute DBeaver command
      const args = [
        '-nosplash',
        '-application', 'org.jkiss.dbeaver.core.application',
        '-con', connection.id,
        '-f', sqlFile,
        '-o', outputFile,
        '-of', 'csv',
        '-quit'
      ];

      await this.executeDBeaver(args);

      // Parse results
      const result = await this.parseCSVOutput(outputFile);
      result.executionTime = Date.now() - startTime;

      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    } finally {
      // Cleanup temporary files
      this.cleanupFiles([sqlFile, outputFile]);
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
        '-application', 'org.jkiss.dbeaver.core.application',
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

  private async executeDBeaver(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.executablePath, args, { stdio: this.debug ? 'inherit' : 'ignore' });
      proc.on('error', reject);
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`DBeaver exited with code ${code}`));
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
        .on('error', reject);
    });
  }

  private getTestQuery(driver: string): string {
    // Delegate to utils
    const { getTestQuery } = require('./utils');
    return getTestQuery(driver);
  }

  private extractVersionFromResult(result: any): string | undefined {
    const { parseVersionFromResult } = require('./utils');
    return parseVersionFromResult(result);
  }

  private buildSchemaQuery(driver: string, tableName: string): string {
    const { buildSchemaQuery } = require('./utils');
    return buildSchemaQuery(driver, tableName);
  }

  private parseSchemaResult(result: any, tableName: string): SchemaInfo {
    // Basic implementation: map columns from result
    const columns = (result.columns || []).map((col: string, idx: number) => ({
      name: col,
      type: 'string',
      nullable: true,
      isPrimaryKey: false,
      isAutoIncrement: false
    }));
    return {
      tableName,
      columns,
      indexes: [],
      constraints: []
    };
  }

  async getDatabaseStats(connection: DBeaverConnection): Promise<DatabaseStats> {
    // Stub implementation
    return {
      connectionId: connection.id,
      tableCount: 0,
      totalSize: '0',
      connectionTime: 0,
      serverVersion: ''
    };
  }

  async listTables(connection: DBeaverConnection, schema?: string, includeViews: boolean = false): Promise<any[]> {
    // Stub implementation
    return [];
  }
}