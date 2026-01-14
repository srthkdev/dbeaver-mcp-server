import { SchemaDiff, TableDiff, ColumnDiff, DiffSummary } from '../types.js';

interface TableSchema {
  tableName: string;
  columns: Map<string, ColumnSchema>;
  indexes: Map<string, IndexSchema>;
}

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
}

/**
 * Compare schemas between two connections
 */
export async function compareSchemas(
  sourceTables: TableSchema[],
  targetTables: TableSchema[],
  sourceConnectionId: string,
  targetConnectionId: string
): Promise<SchemaDiff> {
  const sourceMap = new Map(sourceTables.map((t) => [t.tableName.toLowerCase(), t]));
  const targetMap = new Map(targetTables.map((t) => [t.tableName.toLowerCase(), t]));

  const differences: TableDiff[] = [];
  const processedTables = new Set<string>();

  // Check tables in source
  for (const [tableName, sourceTable] of sourceMap) {
    processedTables.add(tableName);
    const targetTable = targetMap.get(tableName);

    if (!targetTable) {
      // Table exists in source but not in target (removed in target)
      differences.push({
        tableName: sourceTable.tableName,
        status: 'removed',
      });
    } else {
      // Table exists in both - compare columns
      const columnDiffs = compareColumns(sourceTable.columns, targetTable.columns);
      const indexDiffs = compareIndexes(sourceTable.indexes, targetTable.indexes);

      if (columnDiffs.length > 0 || indexDiffs.length > 0) {
        differences.push({
          tableName: sourceTable.tableName,
          status: 'modified',
          columnDiffs,
          indexDiffs,
        });
      }
    }
  }

  // Check tables only in target (added)
  for (const [tableName, targetTable] of targetMap) {
    if (!processedTables.has(tableName)) {
      differences.push({
        tableName: targetTable.tableName,
        status: 'added',
      });
    }
  }

  // Calculate summary
  const summary: DiffSummary = {
    tablesAdded: differences.filter((d) => d.status === 'added').length,
    tablesRemoved: differences.filter((d) => d.status === 'removed').length,
    tablesModified: differences.filter((d) => d.status === 'modified').length,
    totalDifferences: differences.length,
  };

  return {
    sourceConnection: sourceConnectionId,
    targetConnection: targetConnectionId,
    differences,
    summary,
  };
}

function compareColumns(
  sourceColumns: Map<string, ColumnSchema>,
  targetColumns: Map<string, ColumnSchema>
): ColumnDiff[] {
  const diffs: ColumnDiff[] = [];
  const processedColumns = new Set<string>();

  // Check columns in source
  for (const [colName, sourceCol] of sourceColumns) {
    processedColumns.add(colName);
    const targetCol = targetColumns.get(colName);

    if (!targetCol) {
      diffs.push({
        columnName: sourceCol.name,
        status: 'removed',
        sourceType: sourceCol.type,
      });
    } else {
      const changes: string[] = [];

      if (normalizeType(sourceCol.type) !== normalizeType(targetCol.type)) {
        changes.push(`type: ${sourceCol.type} -> ${targetCol.type}`);
      }
      if (sourceCol.nullable !== targetCol.nullable) {
        changes.push(`nullable: ${sourceCol.nullable} -> ${targetCol.nullable}`);
      }
      if (sourceCol.defaultValue !== targetCol.defaultValue) {
        changes.push(
          `default: ${sourceCol.defaultValue || 'NULL'} -> ${targetCol.defaultValue || 'NULL'}`
        );
      }

      if (changes.length > 0) {
        diffs.push({
          columnName: sourceCol.name,
          status: 'modified',
          sourceType: sourceCol.type,
          targetType: targetCol.type,
          changes,
        });
      }
    }
  }

  // Check columns only in target (added)
  for (const [colName, targetCol] of targetColumns) {
    if (!processedColumns.has(colName)) {
      diffs.push({
        columnName: targetCol.name,
        status: 'added',
        targetType: targetCol.type,
      });
    }
  }

  return diffs;
}

function compareIndexes(
  sourceIndexes: Map<string, IndexSchema>,
  targetIndexes: Map<string, IndexSchema>
): { indexName: string; status: 'added' | 'removed' | 'modified'; changes?: string[] }[] {
  const diffs: {
    indexName: string;
    status: 'added' | 'removed' | 'modified';
    changes?: string[];
  }[] = [];
  const processedIndexes = new Set<string>();

  for (const [indexName, sourceIdx] of sourceIndexes) {
    processedIndexes.add(indexName);
    const targetIdx = targetIndexes.get(indexName);

    if (!targetIdx) {
      diffs.push({ indexName: sourceIdx.name, status: 'removed' });
    } else {
      const changes: string[] = [];

      if (JSON.stringify(sourceIdx.columns) !== JSON.stringify(targetIdx.columns)) {
        changes.push(
          `columns: [${sourceIdx.columns.join(', ')}] -> [${targetIdx.columns.join(', ')}]`
        );
      }
      if (sourceIdx.unique !== targetIdx.unique) {
        changes.push(`unique: ${sourceIdx.unique} -> ${targetIdx.unique}`);
      }

      if (changes.length > 0) {
        diffs.push({ indexName: sourceIdx.name, status: 'modified', changes });
      }
    }
  }

  for (const [indexName, targetIdx] of targetIndexes) {
    if (!processedIndexes.has(indexName)) {
      diffs.push({ indexName: targetIdx.name, status: 'added' });
    }
  }

  return diffs;
}

/**
 * Normalize SQL type for comparison (handles variations like INT vs INTEGER)
 */
function normalizeType(type: string): string {
  const normalized = type.toLowerCase().trim();

  const typeMap: Record<string, string> = {
    int: 'integer',
    int4: 'integer',
    int8: 'bigint',
    int2: 'smallint',
    bool: 'boolean',
    float4: 'real',
    float8: 'double precision',
    varchar: 'character varying',
    char: 'character',
    'timestamp without time zone': 'timestamp',
    'timestamp with time zone': 'timestamptz',
  };

  // Remove length specifiers for comparison
  const baseType = normalized.replace(/\(\d+(?:,\s*\d+)?\)/, '').trim();

  return typeMap[baseType] || baseType;
}

/**
 * Parse schema query results into TableSchema format
 */
export function parseTableSchema(
  tableName: string,
  schemaRows: unknown[][],
  columns: string[]
): TableSchema {
  const columnMap = new Map<string, ColumnSchema>();
  const indexMap = new Map<string, IndexSchema>();

  // Map column names to indices
  const colIdx: Record<string, number> = {};
  columns.forEach((col, idx) => {
    colIdx[col.toLowerCase()] = idx;
  });

  for (const row of schemaRows) {
    const colName = String(row[colIdx['column_name'] ?? colIdx['name'] ?? 0]);
    const colType = String(row[colIdx['data_type'] ?? colIdx['type'] ?? 1]);
    const nullable = String(row[colIdx['is_nullable'] ?? colIdx['notnull'] ?? 2]);

    columnMap.set(colName.toLowerCase(), {
      name: colName,
      type: colType,
      nullable:
        nullable.toLowerCase() === 'yes' || nullable === '0' || nullable.toLowerCase() === 'true',
      defaultValue: row[colIdx['column_default'] ?? colIdx['dflt_value']] as string | undefined,
    });
  }

  return {
    tableName,
    columns: columnMap,
    indexes: indexMap,
  };
}

/**
 * Generate SQL migration script from schema diff
 */
export function generateMigrationScript(diff: SchemaDiff, driver: string): string {
  const lines: string[] = [];
  const driverLower = driver.toLowerCase();

  lines.push(`-- Migration script from ${diff.sourceConnection} to ${diff.targetConnection}`);
  lines.push(`-- Generated at ${new Date().toISOString()}`);
  lines.push('');

  for (const tableDiff of diff.differences) {
    if (tableDiff.status === 'added') {
      lines.push(`-- TODO: Create table ${tableDiff.tableName}`);
      lines.push(`-- CREATE TABLE ${tableDiff.tableName} (...);`);
      lines.push('');
    } else if (tableDiff.status === 'removed') {
      lines.push(`-- Table ${tableDiff.tableName} exists in source but not in target`);
      lines.push(`-- DROP TABLE IF EXISTS ${tableDiff.tableName};`);
      lines.push('');
    } else if (tableDiff.status === 'modified') {
      lines.push(`-- Modify table ${tableDiff.tableName}`);

      for (const colDiff of tableDiff.columnDiffs || []) {
        if (colDiff.status === 'added') {
          lines.push(
            `ALTER TABLE ${tableDiff.tableName} ADD COLUMN ${colDiff.columnName} ${colDiff.targetType};`
          );
        } else if (colDiff.status === 'removed') {
          lines.push(`ALTER TABLE ${tableDiff.tableName} DROP COLUMN ${colDiff.columnName};`);
        } else if (colDiff.status === 'modified') {
          if (driverLower.includes('postgres')) {
            lines.push(
              `ALTER TABLE ${tableDiff.tableName} ALTER COLUMN ${colDiff.columnName} TYPE ${colDiff.targetType};`
            );
          } else if (driverLower.includes('mysql')) {
            lines.push(
              `ALTER TABLE ${tableDiff.tableName} MODIFY COLUMN ${colDiff.columnName} ${colDiff.targetType};`
            );
          } else {
            lines.push(
              `-- ALTER TABLE ${tableDiff.tableName} ALTER COLUMN ${colDiff.columnName} TYPE ${colDiff.targetType};`
            );
          }
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
