---
sidebar_position: 2
---

# Available Tools

| Tool                  | Description                            | Safety Level      |
| --------------------- | -------------------------------------- | ----------------- |
| list\_connections     | List all DBeaver database connections  | ✅ Safe            |
| get\_connection\_info | Get detailed connection information    | ✅ Safe            |
| execute\_query        | Execute SELECT queries (read-only)     | ✅ Safe            |
| write\_query          | Execute INSERT, UPDATE, DELETE queries | ⚠️ Modifies data  |
| create\_table         | Create new database tables             | ⚠️ Schema changes |
| alter\_table          | Modify existing table schemas          | ⚠️ Schema changes |
| drop\_table           | Remove tables (requires confirmation)  | ❌ Destructive     |
| get\_table\_schema    | Get detailed table schema information  | ✅ Safe            |
| list\_tables          | List all tables and views in database  | ✅ Safe            |
| export\_data          | Export query results to CSV/JSON       | ✅ Safe            |
| test\_connection      | Test database connectivity             | ✅ Safe            |
| get\_database\_stats  | Get database statistics and info       | ✅ Safe            |
| append\_insight       | Add business insights to memo          | ✅ Safe            |
| list\_insights        | List stored business insights          | ✅ Safe            | 