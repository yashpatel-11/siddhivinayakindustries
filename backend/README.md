# Siddhivinayak CNC - PHP Backend (MySQL)

Full-featured RESTful API backend for CNC Workshop Stock & Delivery Challan management.

## Requirements
- PHP 7.4+ or 8.x (with PDO and pdo_mysql extensions enabled)
- MySQL 5.7+ or MariaDB 10.3+ (e.g. via XAMPP, WAMP, Laragon, or standalone MySQL)

## Database Configuration
The database connection settings are located in `config/database.php`:
```php
$host = "127.0.0.1";
$db_name = "siddhivinayak_cnc";
$username = "root";
$password = "";
$port = "3306";
```
You can also set environment variables: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`.

## 1-Click Database Setup
1. Ensure your MySQL service is started (e.g., in XAMPP control panel click "Start" next to MySQL).
2. Open in your browser:
   `http://localhost:8000/api/setup.php` (or `http://localhost/siddhivinayak/backend/api/setup.php` in XAMPP)
   Or run schema import directly in MySQL:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

## Starting Local PHP Server
Run from the `backend/` directory:
```bash
php -S localhost:8000
```
Then visit `http://localhost:8000` to see the API dashboard and health status.

## Endpoints Overview
- `GET /api/dashboard.php`: Dashboard KPIs, recent inward/outward activities.
- `GET /api/stock.php?type=part_wise`: Aggregated stock per part across all clients.
- `GET /api/stock.php?type=party_wise`: Stock grouped by party/customer with nested part balances.
- `GET /api/stock.php?type=matrix`: Party x Part cross matrix.
- `GET /api/stock.php?type=ledger&party_id=X&part_id=Y`: Detailed chronological ledger.
- `GET/POST/DELETE /api/inward.php`: Inward challan document management.
- `GET/POST/DELETE /api/outward.php`: Outward challan document management.
- `GET/POST/PUT/DELETE /api/parties.php`: Parties / Supplier / Customer master.
- `GET/POST/PUT/DELETE /api/parts.php`: CNC Parts master.

