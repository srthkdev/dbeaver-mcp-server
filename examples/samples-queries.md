# Sample Queries and Usage Examples

## Basic Database Operations

### List all connections
"Show me all my database connections"

### Execute simple query
"Run this query on my PostgreSQL database: SELECT COUNT(*) FROM orders"

### Get table information
"What columns does the users table have in my MySQL database?"

## Advanced Usage

### Data Analysis
"Analyze sales trends from my retail database - show me monthly revenue for the last 6 months"

### Schema Exploration
"What are all the tables in my inventory database and their relationships?"

### Data Export
"Export all customer data from the last month to CSV format"

## Database-Specific Examples

### PostgreSQL
```sql
-- Complex analytics query
SELECT 
    date_trunc('month', order_date) as month,
    SUM(total_amount) as revenue,
    COUNT(*) as order_count
FROM orders 
WHERE order_date >= '2024-01-01'
GROUP BY date_trunc('month', order_date)
ORDER BY month;
```

### MySQL
```sql
-- Performance optimization query
EXPLAIN SELECT * FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.price > 100;
```

### MongoDB (via DBeaver's MongoDB support)
```javascript
// Aggregation pipeline
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customer_id", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
```

## Integration Patterns

### With Claude for Business Intelligence
"Connect to my sales database and create a summary report of this quarter's performance including:
- Total revenue
- Top 5 products by sales
- Customer acquisition trends
- Regional performance breakdown"

### For Database Maintenance
"Check the health of my production database:
- Show table sizes
- Identify slow queries
- Check for missing indexes
- Analyze storage usage"

### For Data Migration Planning
"Help me plan a migration from MySQL to PostgreSQL:
- Analyze current schema
- Identify potential compatibility issues
- Suggest optimization opportunities"
