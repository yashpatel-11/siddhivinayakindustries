# Siddhivinayak CNC Workshop - Stock & Challan Management System

A full-stack web application designed for CNC machining and jobwork workshops. It maintains inventory **part-wise** and **party-wise**, generates and tracks **Inward Delivery Challans** and **Outward Dispatch Challans** compliant with **Rule 55 under CGST Rules, 2017**.

---

## 📁 Project Structure

```
d:\siddhivinayak\
├── backend/                  # PHP REST API + MySQL Database
│   ├── api/
│   │   ├── dashboard.php     # Overall KPI stats, recent transactions, inventory levels
│   │   ├── inward.php        # Inward challans CRUD & line items
│   │   ├── outward.php       # Outward challans CRUD & line items
│   │   ├── parties.php       # Customers / Suppliers / Jobwork Providers CRUD
│   │   ├── parts.php         # CNC Components & Material Grades CRUD
│   │   ├── setup.php         # 1-Click MySQL database & table installer + sample seeder
│   │   └── stock.php         # Part-wise, Party-wise, Cross-matrix & Movement Ledger API
│   ├── config/
│   │   ├── cors.php          # Cross-Origin Resource Sharing headers & JSON helpers
│   │   └── database.php      # PDO MySQL connection class with error diagnostics
│   ├── database/
│   │   └── schema.sql        # Full MySQL DDL & DML matching real-world challan specs
│   ├── index.php             # API documentation & live health check page
│   └── README.md             # Backend setup guide
│
├── frontend/                 # React 19 + Vite + Tailwind CSS Single Page Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChallanPrintModal.jsx  # Official GST Rule 55 Delivery Challan printable format
│   │   │   └── Navbar.jsx             # Top bar with tab navigation & MySQL status widget
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Workshop operations overview & KPI summary
│   │   │   ├── InwardChallans.jsx     # Receive jobwork materials with multi-line items
│   │   │   ├── OutwardChallans.jsx    # Dispatch finished goods with stock deduction
│   │   │   ├── Parties.jsx            # Customers directory (Name, GSTIN, Address, State)
│   │   │   ├── Parts.jsx              # CNC components catalog (Part No, Grade, HSN, Rate)
│   │   │   └── StockManagement.jsx    # Part-wise, Party-wise, Matrix & Transaction Ledger
│   │   ├── services/
│   │   │   └── api.js                 # API service connecting to PHP MySQL + local fallback
│   │   ├── App.jsx                    # Root component coordinating state & modal views
│   │   ├── index.css                  # Tailwind styles + print media rules
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── Assets/
    ├── Inward chalan.PDF     # Sample Delivery Challan (AJK Forge Private Limited, SG2639BRMC)
    └── requirements.txt      # System requirements specification
```

---

## 🚀 Quick Start Guide

### 1. Database Setup (MySQL)
1. Start your MySQL service (e.g., in XAMPP, WAMP, Laragon, or Docker).
2. Open your browser or run the schema import:
   - **Option A (Web 1-Click):** Once the PHP server is running, visit `http://localhost:8000/api/setup.php`.
   - **Option B (MySQL CLI / phpMyAdmin):**
     ```bash
     mysql -u root -p < backend/database/schema.sql
     ```
   *(Default connection in `backend/config/database.php` uses `127.0.0.1:3306`, user: `root`, password: ``)*

### 2. Run the PHP Backend
From the root folder:
```bash
cd backend
php -S localhost:8000
```
- Open `http://localhost:8000` to verify API health and MySQL connection.

### 3. Run the React Frontend
Open another terminal:
```bash
cd frontend
npm run dev
```
- Open your browser at `http://localhost:5173`.

---

## 🛠 Key Features

1. **Part-wise Stock Tracking:**
   - Aggregates inventory by component drawing number (e.g., `SG2639BRMC`, `FL-4401-PIN`).
   - Computes: `Current Stock = Total Inward - (Dispatched + Scrap/Rejections)`.
   - Color-coded badges and exportable to CSV.

2. **Party-wise Stock Tracking:**
   - Grouped overview by Customer / Jobwork Client (e.g., `AJK FORGE PRIVATE LIMITED`).
   - View exact pieces received, finished, and pending for each party.
   - 1-click **"Dispatch This Part"** button pre-filling the outward challan.

3. **Official CGST Rule 55 Delivery Challan:**
   - Accurate reproduction of Jobwork Delivery Challan layout.
   - Includes Supplier Details, Jobworker Details, E-Way Bill No., Vehicle No., Nature of Processing (`BROACHING / CNC TURNING`), Goods table, and Part II signoff for jobworkers.
   - Print-ready with browser print dialog integration.

4. **Chronological Movement Ledger:**
   - Filter transactions by party and/or part to audit full transaction history with running balances.

