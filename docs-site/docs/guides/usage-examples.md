# Usage Examples

## Connection Management

```
"Show me all my database connections"
"Test the connection to my PostgreSQL database"
"Tell me about my connection named 'prod-db'"
```

## Running Queries

### SELECT (safe)
```sql
"Run on my sales database: SELECT COUNT(*) FROM orders WHERE date > '2024-01-01'"

"Execute on warehouse:
SELECT
    DATE_TRUNC('month', order_date) as month,
    SUM(total_amount) as revenue
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY 1"
```

### INSERT/UPDATE/DELETE
```sql
"Insert into customers:
INSERT INTO customers (name, email) VALUES ('John Doe', 'john@example.com')"

"Update email for customer 123:
UPDATE customers SET email = 'new@example.com' WHERE customer_id = 123"

"Delete test records:
DELETE FROM test_orders WHERE created_date < '2024-01-01'"
```

## Schema Operations

### Create tables
```sql
"Create a products table:
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
)"
```

### Modify tables
```sql
"Add a description column:
ALTER TABLE products ADD COLUMN description TEXT"
```

### Drop tables
```
"Drop the test_products table - confirm this action"
```

## Schema Inspection

```
"What's the schema of the users table?"
"List all tables in my database"
"Show me columns in the orders table"
```

## Data Export

```
"Export customer data to CSV:
SELECT customer_id, name, email FROM customers"

"Export products as JSON:
SELECT id, name, price FROM products WHERE active = true"
```

## Storing Notes

```
"Save this insight: Q4 showed 23% increase in mobile orders. Tag as 'quarterly'"
"Show me all insights tagged 'quarterly'"
```

## Safety Features

Dangerous operations are blocked or require confirmation:

```
"DROP DATABASE production"  -- blocked
"DELETE FROM users"         -- warns about missing WHERE
"Drop the test_table"       -- requires confirmation
```
