# DBeaver MCP Server - Usage Examples & Sample Queries

This guide provides comprehensive examples of how to use the DBeaver MCP Server with Claude, Cursor, and other AI assistants.

## 🔧 Connection Management

### List All Connections
```
"Show me all my database connections"
"List available databases with details"
```

### Get Connection Details
```
"Tell me about my PostgreSQL connection named 'prod-db'"
"Show detailed information for connection id 'mysql-local'"
```

### Test Connection
```
"Test the connection to my Oracle database"
"Check if my SQL Server connection is working"
```

## 📊 Basic Database Operations

### Read Operations (Safe)
```sql
-- Simple data retrieval
"Run this query on my sales database: SELECT COUNT(*) FROM orders WHERE created_date > '2024-01-01'"

-- Complex analytics
"Execute this analysis on my warehouse database:
SELECT 
    DATE_TRUNC('month', order_date) as month,
    SUM(total_amount) as revenue,
    COUNT(*) as order_count,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE order_date >= '2024-01-01'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month"

-- Performance queries
"Show me the top 10 customers by total purchase amount"
```

### Write Operations (Requires Confirmation)
```sql
-- Data insertion
"Insert a new customer record:
INSERT INTO customers (name, email, created_date) 
VALUES ('John Doe', 'john@example.com', NOW())"

-- Data updates
"Update customer email:
UPDATE customers 
SET email = 'newemail@example.com' 
WHERE customer_id = 123"

-- Data cleanup
"Delete test records:
DELETE FROM test_orders 
WHERE created_date < '2024-01-01'"
```

## 🏗️ Schema Management

### Table Creation
```sql
-- Create a new table
"Create a products table with these columns:
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    category_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)"

-- Create with constraints
"Create an inventory table:
CREATE TABLE inventory (
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    warehouse_location VARCHAR(100),
    last_updated TIMESTAMP DEFAULT NOW()
)"
```

### Schema Modifications
```sql
-- Add new columns
"Add a description column to the products table:
ALTER TABLE products ADD COLUMN description TEXT"

-- Modify existing columns
"Change the price column to allow larger values:
ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(12,2)"

-- Add indexes for performance
"Add an index on the created_at column:
CREATE INDEX idx_products_created_at ON products(created_at)"
```

### Table Removal (Safety Required)
```
"I need to drop the test_products table - please confirm first"
"Remove the temporary_data table with confirmation"
```

## 📋 Schema Introspection

### Table Information
```
"What's the schema of the users table?"
"Show me all columns in the orders table with their data types"
"Describe the structure of the products table including indexes"
```

### Database Overview
```
"List all tables in my e-commerce database"
"Show me tables and views in the analytics schema"
"What tables exist in my PostgreSQL database?"
```

### Database Statistics
```
"Get statistics about my production database"
"Show me database size and performance metrics"
"What's the current status of my MySQL server?"
```

## 📤 Data Export & Analysis

### CSV Export
```
"Export all customer data to CSV:
SELECT customer_id, name, email, total_orders, total_spent 
FROM customer_summary 
WHERE registration_date >= '2024-01-01'"

"Export quarterly sales report as CSV"
```

### JSON Export
```
"Export product catalog as JSON for the API:
SELECT id, name, price, category, attributes 
FROM products 
WHERE active = true"

"Get user preferences in JSON format"
```

### Business Intelligence Queries
```sql
-- Revenue analysis
"Analyze revenue trends by quarter:
SELECT 
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(QUARTER FROM order_date) as quarter,
    SUM(total_amount) as revenue,
    COUNT(*) as orders,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders 
GROUP BY year, quarter 
ORDER BY year, quarter"

-- Customer segmentation
"Segment customers by purchase behavior:
SELECT 
    CASE 
        WHEN total_spent > 1000 THEN 'High Value'
        WHEN total_spent > 500 THEN 'Medium Value'
        ELSE 'Low Value'
    END as segment,
    COUNT(*) as customer_count,
    AVG(total_spent) as avg_spending
FROM customer_summary 
GROUP BY segment"
```

## 🧠 Business Insights Tracking

### Adding Insights
```
"Save this insight: Q4 2024 showed a 23% increase in mobile orders compared to desktop, indicating a strong mobile-first trend. Tag this as 'quarterly-analysis' and 'mobile-trends'"

"Record this finding: Customer retention rate improved by 15% after implementing the loyalty program. Tag as 'retention' and 'loyalty-program'"

"Note this observation: Database performance degraded during peak hours (2-4 PM EST) due to complex reporting queries. Tag as 'performance' and 'optimization-needed'"
```

### Reviewing Insights
```
"Show me all insights related to sales performance"
"List insights tagged with 'quarterly-analysis'"
"What insights do we have for the customer database?"
"Display all business insights from the last month"
```

## 🔍 Advanced Use Cases

### Data Quality Analysis
```sql
"Check for data quality issues:
SELECT 
    'Missing emails' as issue,
    COUNT(*) as count
FROM customers 
WHERE email IS NULL OR email = ''

UNION ALL

SELECT 
    'Invalid phone numbers' as issue,
    COUNT(*) as count
FROM customers 
WHERE phone NOT LIKE '+%' AND phone IS NOT NULL"
```

### Performance Optimization
```sql
"Find slow-performing queries by analyzing execution plans:
EXPLAIN ANALYZE 
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.order_date >= '2024-01-01'"

"Identify tables that need indexing:
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%_id'
AND table_name NOT IN (
    SELECT table_name 
    FROM information_schema.statistics 
    WHERE column_name LIKE '%_id'
)"
```

### Data Migration Planning
```
"Help me analyze the current schema for migration planning"
"What are the foreign key relationships in my database?"
"Identify potential issues for migrating from MySQL to PostgreSQL"
```

## 🚨 Safety Features Demo

### Query Validation
```
"Try to run: DROP DATABASE production" 
// → Will be blocked with safety warning

"Attempt: DELETE FROM users"
// → Will warn about missing WHERE clause

"Execute: UPDATE products SET price = 0"
// → Will flag as potentially dangerous
```

### Confirmation Requirements
```
"Drop the test_table" 
// → Will require explicit confirmation

"I want to remove the backup_data table - confirm this action"
// → Will proceed only with proper confirmation
```

## 🔧 Resource Browsing

When using MCP clients that support resources:

1. **Browse Available Schemas**: Resources automatically list all table schemas
2. **Schema Details**: Click on any table resource to see detailed schema information
3. **Structured Data**: All schema information is provided in JSON format
4. **Real-time Updates**: Resources reflect current database state

## 💡 Integration Patterns

### With Claude for Data Analysis
```
"Connect to my analytics database and provide a comprehensive business intelligence report including:
1. Revenue trends over the last 6 months
2. Top performing products by category
3. Customer acquisition and retention metrics
4. Seasonal patterns in sales data
5. Recommendations for improvement

Save key insights with appropriate tags for future reference."
```

### With Cursor for Development
```
"Help me build a new feature by:
1. Creating the necessary database tables
2. Adding appropriate indexes
3. Writing sample data insertion queries
4. Creating views for common reporting needs
5. Documenting the schema changes"
```

### For Database Administration
```
"Perform a health check on my production database:
1. Check connection status
2. Analyze table sizes and growth
3. Identify missing indexes
4. Review recent query performance
5. Generate a maintenance report"
```

## 🎯 Best Practices

1. **Start with Read Operations**: Always test with SELECT queries first
2. **Use Confirmations**: Enable confirmation for destructive operations
3. **Track Insights**: Document important findings for future reference
4. **Export Results**: Use export features for further analysis
5. **Monitor Performance**: Track query execution times
6. **Validate Changes**: Test schema modifications in development first

## 🚀 Production Tips

- Set appropriate timeout values for large queries
- Use debug mode during development
- Leverage business insights for documentation
- Export data regularly for backup/analysis
- Monitor connection health proactively
- Use resource browsing for schema exploration
