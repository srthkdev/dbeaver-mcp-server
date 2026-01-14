---
sidebar_position: 1
---

# Introduction

DBeaver MCP Server is a Model Context Protocol server that connects AI assistants to databases through your existing DBeaver connections.

## Why Use This?

- **No extra config**: Uses connections you've already set up in DBeaver
- **Wide database support**: Works with any database DBeaver supports
- **Native drivers**: Direct execution for PostgreSQL, MySQL, SQLite, SQL Server
- **Safety built-in**: Query validation, confirmation prompts for destructive ops

## What It Does

- Lists and tests DBeaver connections
- Executes SELECT, INSERT, UPDATE, DELETE queries
- Manages schema (CREATE/ALTER/DROP tables)
- Exports data to CSV/JSON
- Stores analysis notes for later reference

## Supported Databases

Native execution (fast, no DBeaver needed):
- PostgreSQL
- MySQL / MariaDB
- SQLite
- SQL Server / MSSQL

Fallback via DBeaver CLI:
- Oracle, MongoDB, and 200+ others that DBeaver supports

## DBeaver Version Support

- DBeaver 6.x: XML config format
- DBeaver 21.x+: JSON config format

The server auto-detects which format you're using.
