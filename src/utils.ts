import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Find DBeaver executable path across different platforms
 */
export function findDBeaverExecutable(): string {
  const platform = os.platform();
  const possiblePaths: string[] = [];

  if (platform === 'win32') {
    possiblePaths.push(
      'C:\\Program Files\\DBeaver\\dbeaver.exe',
      'C:\\Program Files (x86)\\DBeaver\\dbeaver.exe',
      path.join(os.homedir(), 'AppData', 'Local', 'DBeaver', 'dbeaver.exe'),
      path.join(os.homedir(), 'scoop', 'apps', 'dbeaver', 'current', 'dbeaver.exe'),
      'dbeaver.exe' // fallback to PATH
    );
  } else if (platform === 'darwin') {
    possiblePaths.push(
      '/Applications/DBeaver.app/Contents/MacOS/dbeaver',
      path.join(os.homedir(), 'Applications', 'DBeaver.app', 'Contents', 'MacOS', 'dbeaver'),
      '/usr/local/bin/dbeaver',
      'dbeaver' // fallback to PATH
    );
  } else {
    // Linux and other Unix-like systems
    possiblePaths.push(
      '/usr/bin/dbeaver',
      '/usr/local/bin/dbeaver',
      '/opt/dbeaver/dbeaver',
      '/snap/bin/dbeaver',
      path.join(os.homedir(), '.local', 'bin', 'dbeaver'),
      path.join(os.homedir(), 'bin', 'dbeaver'),
      'dbeaver' // fallback to PATH
    );
  }

  // Find first existing executable
  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      try {
        fs.accessSync(dbPath, fs.constants.X_OK);
        return dbPath;
      } catch (error) {
        // Not executable, continue searching
        continue;
      }
    }
  }

  // Return fallback (will rely on system PATH)
  return platform === 'win32' ? 'dbeaver.exe' : 'dbeaver';
}

/**
 * Validate SQL query for basic safety
 */
export function validateQuery(query: string): string | null {
  if (!query || query.trim().length === 0) {
    return 'Query cannot be empty';
  }

  const trimmedQuery = query.trim().toLowerCase();
  
  // Block potentially dangerous operations
  const dangerousPatterns = [
    /drop\s+database/i,
    /drop\s+schema/i,
    /truncate\s+table/i,
    /delete\s+from\s+\w+\s*$/i, // DELETE without WHERE clause
    /update\s+\w+\s+set\s+.*\s*$/i, // UPDATE without WHERE clause
    /grant\s+/i,
    /revoke\s+/i,
    /create\s+user/i,
    /drop\s+user/i,
    /alter\s+user/i,
    /shutdown/i,
    /restart/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedQuery)) {
      return `Potentially dangerous query detected. Query blocked for safety.`;
    }
  }

  // Warn about operations that modify data
  const modifyingPatterns = [
    /^insert\s+/i,
    /^update\s+/i,
    /^delete\s+/i,
    /^create\s+/i,
    /^alter\s+/i,
    /^drop\s+/i
  ];

  for (const pattern of modifyingPatterns) {
    if (pattern.test(trimmedQuery)) {
      // Allow but note - could add confirmation in future
      break;
    }
  }

  return null; // Query is valid
}

/**
 * Sanitize connection ID to prevent injection
 */
export function sanitizeConnectionId(connectionId: string): string {
  if (!connectionId || typeof connectionId !== 'string') {
    throw new Error('Connection ID must be a non-empty string');
  }

  // Remove potentially dangerous characters
  const sanitized = connectionId.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  
  if (sanitized.length === 0) {
    throw new Error('Connection ID contains no valid characters');
  }

  return sanitized;
}

/**
 * Format error messages consistently
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return String(error);
}

/**
 * Get test query based on database driver
 */
export function getTestQuery(driver: string): string {
  const driverLower = driver.toLowerCase();
  
  if (driverLower.includes('postgresql') || driverLower.includes('postgres')) {
    return 'SELECT version();';
  } else if (driverLower.includes('mysql')) {
    return 'SELECT version();';
  } else if (driverLower.includes('oracle')) {
    return 'SELECT * FROM dual;';
  } else if (driverLower.includes('sqlite')) {
    return 'SELECT sqlite_version();';
  } else if (driverLower.includes('mssql') || driverLower.includes('sqlserver')) {
    return 'SELECT @@VERSION;';
  } else if (driverLower.includes('mongodb')) {
    return 'db.version()';
  } else if (driverLower.includes('redis')) {
    return 'INFO server';
  } else {
    // Generic test query
    return 'SELECT 1;';
  }
}

/**
 * Build schema query based on database driver
 */
export function buildSchemaQuery(driver: string, tableName: string): string {
  const driverLower = driver.toLowerCase();
  
  if (driverLower.includes('postgresql') || driverLower.includes('postgres')) {
    return `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
  } else if (driverLower.includes('mysql')) {
    return `
      SELECT 
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
        NUMERIC_PRECISION as numeric_precision,
        NUMERIC_SCALE as numeric_scale,
        COLUMN_KEY as column_key,
        EXTRA as extra
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION;
    `;
  } else if (driverLower.includes('sqlite')) {
    return `PRAGMA table_info(${tableName});`;
  } else if (driverLower.includes('oracle')) {
    return `
      SELECT 
        column_name,
        data_type,
        nullable,
        data_default,
        data_length,
        data_precision,
        data_scale
      FROM user_tab_columns 
      WHERE table_name = UPPER('${tableName}')
      ORDER BY column_id;
    `;
  } else if (driverLower.includes('mssql') || driverLower.includes('sqlserver')) {
    return `
      SELECT 
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
        NUMERIC_PRECISION as numeric_precision,
        NUMERIC_SCALE as numeric_scale
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION;
    `;
  } else {
    // Generic fallback
    return `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = '${tableName}';
    `;
  }
}

/**
 * Build list tables query based on database driver
 */
export function buildListTablesQuery(driver: string, schema?: string, includeViews: boolean = false): string {
  const driverLower = driver.toLowerCase();
  
  if (driverLower.includes('postgresql') || driverLower.includes('postgres')) {
    let query = `
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `;
    
    if (schema) {
      query += ` AND table_schema = '${schema}'`;
    }
    
    if (!includeViews) {
      query += ` AND table_type = 'BASE TABLE'`;
    }
    
    query += ` ORDER BY table_schema, table_name;`;
    return query;
    
  } else if (driverLower.includes('mysql')) {
    let query = `
      SELECT 
        TABLE_NAME as table_name,
        TABLE_TYPE as table_type,
        TABLE_SCHEMA as table_schema
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
    `;
    
    if (schema) {
      query += ` AND TABLE_SCHEMA = '${schema}'`;
    }
    
    if (!includeViews) {
      query += ` AND TABLE_TYPE = 'BASE TABLE'`;
    }
    
    query += ` ORDER BY TABLE_SCHEMA, TABLE_NAME;`;
    return query;
    
  } else if (driverLower.includes('sqlite')) {
    let query = `
      SELECT 
        name as table_name,
        type as table_type
      FROM sqlite_master 
      WHERE type IN ('table'${includeViews ? ", 'view'" : ''})
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `;
    return query;
    
  } else if (driverLower.includes('oracle')) {
    let query = `
      SELECT 
        table_name,
        'TABLE' as table_type,
        owner as table_schema
      FROM all_tables
    `;
    
    if (schema) {
      query += ` WHERE owner = UPPER('${schema}')`;
    }
    
    if (includeViews) {
      query += `
        UNION ALL
        SELECT 
          view_name as table_name,
          'VIEW' as table_type,
          owner as table_schema
        FROM all_views
      `;
      
      if (schema) {
        query += ` WHERE owner = UPPER('${schema}')`;
      }
    }
    
    query += ` ORDER BY table_name;`;
    return query;
    
  } else {
    // Generic fallback
    let query = `
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables
    `;
    
    if (schema) {
      query += ` WHERE table_schema = '${schema}'`;
    }
    
    if (!includeViews) {
      query += `${schema ? ' AND' : ' WHERE'} table_type = 'BASE TABLE'`;
    }
    
    query += ` ORDER BY table_schema, table_name;`;
    return query;
  }
}

/**
 * Parse database version from query result
 */
export function parseVersionFromResult(result: any): string | undefined {
  if (!result || !result.rows || result.rows.length === 0) {
    return undefined;
  }

  const firstRow = result.rows[0];
  if (Array.isArray(firstRow) && firstRow.length > 0) {
    return String(firstRow[0]);
  } else if (firstRow && typeof firstRow === 'object') {
    const firstValue = Object.values(firstRow)[0];
    return firstValue !== undefined ? String(firstValue) : undefined;
  }
  return undefined;
}

/**
 * Convert query results to CSV format
 */
export function convertToCSV(columns: string[], rows: any[][]): string {
  if (rows.length === 0) return '';
  
  // Create CSV header row
  let csv = columns.map(col => `"${col.replace(/"/g, '""')}"`).join(',') + '\n';
  
  // Add data rows
  rows.forEach(row => {
    const values = row.map(val => {
      // Handle null/undefined values
      if (val === null || val === undefined) {
        return '';
      }
      
      // Convert to string and escape quotes
      const strVal = String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
}