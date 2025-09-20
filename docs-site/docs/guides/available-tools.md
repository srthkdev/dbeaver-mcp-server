---
sidebar_position: 2
---

# Available Tools

The DBeaver MCP Server provides 14 powerful tools organized into four categories. Each tool is designed with safety in mind, with clear indicators of their impact level.

## 📋 Connection Management

### `list_connections`
**Description**: List all available DBeaver database connections  
**Safety Level**: ✅ Safe  
**Parameters**:
- `includeDetails` (optional): Include detailed connection information

**Example**:
```json
{
  "includeDetails": true
}
```

### `get_connection_info`
**Description**: Get detailed information about a specific DBeaver connection  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection

### `test_connection`
**Description**: Test connectivity to a DBeaver connection  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection to test

## 📊 Data Operations

### `execute_query`
**Description**: Execute SELECT queries (read-only)  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `query` (required): The SQL query to execute (SELECT statements only)
- `maxRows` (optional): Maximum number of rows to return (default: 1000)

### `write_query`
**Description**: Execute INSERT, UPDATE, or DELETE queries  
**Safety Level**: ⚠️ Modifies data  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `query` (required): The SQL query to execute (INSERT, UPDATE, DELETE)

### `export_data`
**Description**: Export query results to various formats (CSV, JSON, XML, Excel)  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `query` (required): The SQL query to execute for export (SELECT only)
- `format` (optional): Export format (csv, json, xml, excel) - default: csv
- `includeHeaders` (optional): Include column headers in export - default: true
- `maxRows` (optional): Maximum number of rows to export - default: 10000

## 🏗️ Schema Management

### `list_tables`
**Description**: List all tables and views in a database  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `schema` (optional): Specific schema to list tables from
- `includeViews` (optional): Include views in the results - default: false

### `get_table_schema`
**Description**: Get detailed table schema information  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `tableName` (required): The name of the table to describe
- `includeIndexes` (optional): Include index information - default: true

### `create_table`
**Description**: Create new database tables  
**Safety Level**: ⚠️ Schema changes  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `query` (required): CREATE TABLE statement

### `alter_table`
**Description**: Modify existing table schemas  
**Safety Level**: ⚠️ Schema changes  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `query` (required): ALTER TABLE statement

### `drop_table`
**Description**: Remove tables with safety confirmation  
**Safety Level**: ❌ Destructive  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection
- `tableName` (required): Name of the table to drop
- `confirm` (required): Safety confirmation flag (must be true)

## 📈 Analytics & Intelligence

### `get_database_stats`
**Description**: Get database statistics and information  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connectionId` (required): The ID or name of the DBeaver connection

### `append_insight`
**Description**: Add business insights to memo  
**Safety Level**: ✅ Safe  
**Parameters**:
- `insight` (required): The business insight or analysis note to store
- `connection` (optional): Connection ID to associate with this insight
- `tags` (optional): Array of tags to categorize the insight

### `list_insights`
**Description**: List stored business insights  
**Safety Level**: ✅ Safe  
**Parameters**:
- `connection` (optional): Filter insights by connection ID
- `tags` (optional): Filter insights by tags

## 🛡️ Safety Guidelines

- **✅ Safe**: Read-only operations that don't modify data or schema
- **⚠️ Modifies data**: Operations that change data but not schema
- **⚠️ Schema changes**: Operations that modify database structure
- **❌ Destructive**: Operations that permanently remove data or objects

All destructive operations require explicit confirmation to prevent accidental data loss. 