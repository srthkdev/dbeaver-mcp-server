# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.5] - 2026-02-15

### Added
- Connection whitelist via `DBEAVER_ALLOWED_CONNECTIONS` environment variable — restrict which DBeaver connections are visible by ID or name
- `enforceReadOnly()` query-level enforcement — `execute_query` now strictly allows only read-only statements (SELECT, EXPLAIN, SHOW, DESCRIBE, PRAGMA)
- Test queries for SAP HANA (`SELECT * FROM DUMMY`) and DB2 (`SYSIBM.SYSDUMMY1`)

### Fixed
- **Read-only mode bypass (Issue #19)**: `execute_query` no longer allows write operations (INSERT/UPDATE/DELETE/CREATE/ALTER/DROP). Transaction tools (`begin_transaction`, `commit_transaction`, `rollback_transaction`, `execute_in_transaction`) are now blocked in read-only mode.
- **Unsupported driver errors (Issue #17)**: DBeaver CLI fallback now provides clear, actionable error messages listing natively supported drivers and workarounds. DBeaver availability is checked before attempting CLI fallback.
- **UPDATE validation regex**: `UPDATE ... SET ... WHERE ...` was incorrectly blocked by the dangerous query filter. The regex now correctly allows UPDATE with WHERE clause.

### Changed
- DBeaver CLI fallback uses connection name-based spec for better compatibility

## [1.2.4] - 2026-01-15

### Added
- Native MySQL/MariaDB support via `mysql2` library
- Read-only mode (`DBEAVER_READ_ONLY=true`) to disable write operations
- Tool filtering via `DBEAVER_DISABLED_TOOLS` environment variable
- GitHub Actions CI/CD pipeline
- ESLint and Prettier configuration
- Pre-commit hooks via Husky
- Vitest test framework
- Issue and PR templates
- Connection pooling for PostgreSQL, MySQL, and MSSQL with configurable pool settings
- Transaction support with `begin_transaction`, `commit_transaction`, `rollback_transaction`, and `execute_in_transaction` tools
- Query explain tool (`explain_query`) for analyzing query execution plans
- Schema comparison tool (`compare_schemas`) for diffing schemas between connections
- Pool statistics tool (`get_pool_stats`) for monitoring connection pool health

### Changed
- Upgraded `@modelcontextprotocol/sdk` from 1.9.0 to 1.25.2 (security fix)
- Improved error messages for unsupported database drivers
- Better trailing semicolon handling in LIMIT clause

### Fixed
- Security vulnerabilities in dependencies
- `@types/mssql` moved to devDependencies
- SQL injection vulnerability in table/schema name handling
- Deprecated `.substr()` replaced with secure `crypto.randomBytes()`
- Added maxRows validation with upper bounds (100k query, 1M export)
- Removed unsupported export formats (xml, excel) from API schema

## [1.2.3] - 2026-01-07

### Added
- Native MSSQL/SQL Server support via `mssql` library
- `xml2js` dependency for DBeaver config parsing

### Fixed
- Missing `xml2js` runtime dependency that broke npm installations
- PostgreSQL connection cleanup logging

## [1.2.2] - 2024-12-XX

### Added
- SSL/TLS support for PostgreSQL connections
- Credential decryption from DBeaver's credentials-config.json

### Fixed
- Authentication failures with PostgreSQL (Issue #8)

## [1.2.0] - 2024-10-XX

### Added
- Native PostgreSQL support via `pg` library
- Native SQLite support via sqlite3 CLI
- DBeaver CLI fallback for unsupported databases
- Business insights tracking feature

### Changed
- Query execution no longer requires DBeaver GUI for supported databases

## [1.1.0] - 2024-09-XX

### Added
- Initial MCP server implementation
- Support for DBeaver 6.x (XML) and 21.x+ (JSON) config formats
- Connection management tools
- Query execution tools
- Schema management tools
- Data export functionality
