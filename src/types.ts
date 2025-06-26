export interface DBeaverConnection {
    id: string;
    name: string;
    driver: string;
    url: string;
    user?: string;
    host?: string;
    port?: number;
    database?: string;
    description?: string;
    connected?: boolean;
    readonly?: boolean;
    folder?: string;
    properties?: Record<string, string>;
  }
  
  export interface QueryResult {
    columns: string[];
    rows: any[][];
    rowCount: number;
    executionTime: number;
    error?: string;
  }
  
  export interface SchemaInfo {
    tableName: string;
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    constraints: ConstraintInfo[];
  }
  
  export interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: string;
    isPrimaryKey: boolean;
    isAutoIncrement: boolean;
    length?: number;
    precision?: number;
    scale?: number;
  }
  
  export interface IndexInfo {
    name: string;
    columns: string[];
    unique: boolean;
    type: string;
  }
  
  export interface ConstraintInfo {
    name: string;
    type: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE' | 'CHECK';
    columns: string[];
    referencedTable?: string;
    referencedColumns?: string[];
  }
  
  export interface ExportOptions {
    format: 'csv' | 'json' | 'xml' | 'excel' | 'sql';
    includeHeaders: boolean;
    delimiter?: string;
    encoding?: string;
    maxRows?: number;
  }
  
  export interface DBeaverConfig {
    workspacePath?: string;
    executablePath?: string;
    timeout?: number;
    debug?: boolean;
  }
  
  export interface ConnectionTest {
    connectionId: string;
    success: boolean;
    error?: string;
    responseTime: number;
    databaseVersion?: string;
  }
  
  export interface DatabaseStats {
    connectionId: string;
    tableCount: number;
    totalSize: string;
    connectionTime: number;
    serverVersion: string;
    uptime?: string;
  }

  export interface BusinessInsight {
    id: number;
    insight: string;
    created_at: string;
    connection?: string;
    tags?: string[];
  }

  export interface TableResource {
    connectionId: string;
    tableName: string;
    schema?: string;
    uri: string;
  }