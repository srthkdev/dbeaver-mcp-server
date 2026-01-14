# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
