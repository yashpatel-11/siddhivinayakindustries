<?php
// backend/index.php - Siddhivinayak CNC Backend API Landing & Health Check
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';

$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$isJson = strpos($accept, 'application/json') !== false || isset($_GET['json']);

$dbStatus = "Not Connected";
$dbError = null;
$counts = [];

try {
    $db = new Database();
    $conn = $db->getConnection();
    $dbStatus = "Connected to MySQL (" . $db->getDbName() . ")";

    $counts['parties'] = (int)$conn->query("SELECT COUNT(*) FROM parties")->fetchColumn();
    $counts['parts'] = (int)$conn->query("SELECT COUNT(*) FROM parts")->fetchColumn();
    $counts['inwards'] = (int)$conn->query("SELECT COUNT(*) FROM inward_challans")->fetchColumn();
    $counts['outwards'] = (int)$conn->query("SELECT COUNT(*) FROM outward_challans")->fetchColumn();
} catch (Exception $e) {
    $dbStatus = "Connection Failed";
    $dbError = $e->getMessage();
}

if ($isJson) {
    sendResponse(200, [
        "name" => "Siddhivinayak CNC Stock & Challan Management API",
        "version" => "1.0.0",
        "status" => "online",
        "database_status" => $dbStatus,
        "database_error" => $dbError,
        "records" => $counts,
        "endpoints" => [
            "GET /api/dashboard.php" => "Dashboard KPIs, recent challans & stock overview",
            "GET /api/stock.php?type=part_wise" => "Stock maintained part-wise",
            "GET /api/stock.php?type=party_wise" => "Stock maintained party-wise",
            "GET /api/stock.php?type=matrix" => "Party x Part stock cross-reference",
            "GET /api/stock.php?type=ledger&party_id=X&part_id=Y" => "Chronological stock movement ledger",
            "GET/POST/PUT/DELETE /api/inward.php" => "Inward Challan management",
            "GET/POST/PUT/DELETE /api/outward.php" => "Outward Challan management",
            "GET/POST/PUT/DELETE /api/parties.php" => "Customers & suppliers directory",
            "GET/POST/PUT/DELETE /api/parts.php" => "CNC Part masters",
            "GET /api/setup.php" => "Database auto-creator & seeder"
        ]
    ]);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Siddhivinayak CNC - Backend API</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
        .container { max-width: 860px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
        h1 { margin-top: 0; color: #38bdf8; font-size: 26px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .badge-success { background: #064e3b; color: #34d399; border: 1px solid #059669; }
        .badge-warning { background: #78350f; color: #fbbf24; border: 1px solid #d97706; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 24px 0; }
        .card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; text-align: center; }
        .card .num { font-size: 28px; font-weight: 700; color: #38bdf8; }
        .card .lbl { font-size: 13px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #334155; font-size: 14px; }
        th { color: #94a3b8; font-weight: 600; background: #0f172a; }
        a { color: #38bdf8; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 15px; }
        .btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ Siddhivinayak CNC Workshop API</h1>
        <p>PHP 8+ Backend Service with MySQL Database for Inward/Outward Challans & Part/Party-wise Stock Tracking.</p>
        
        <div>
            Status: 
            <?php if (strpos($dbStatus, 'Connected') !== false): ?>
                <span class="badge badge-success">● <?= htmlspecialchars($dbStatus) ?></span>
            <?php else: ?>
                <span class="badge badge-warning">⚠ <?= htmlspecialchars($dbStatus) ?></span>
                <p style="color: #f87171; font-size: 14px;"><?= htmlspecialchars($dbError) ?></p>
                <a href="api/setup.php" class="btn">Run Database Setup & Seed Data</a>
            <?php endif; ?>
        </div>

        <?php if (!empty($counts)): ?>
        <div class="grid">
            <div class="card"><div class="num"><?= $counts['parties'] ?? 0 ?></div><div class="lbl">Parties</div></div>
            <div class="card"><div class="num"><?= $counts['parts'] ?? 0 ?></div><div class="lbl">Parts Masters</div></div>
            <div class="card"><div class="num"><?= $counts['inwards'] ?? 0 ?></div><div class="lbl">Inward Challans</div></div>
            <div class="card"><div class="num"><?= $counts['outwards'] ?? 0 ?></div><div class="lbl">Outward Challans</div></div>
        </div>
        <?php endif; ?>

        <h3>API Endpoints</h3>
        <table>
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><a href="api/dashboard.php" target="_blank">/api/dashboard.php</a></td>
                    <td>GET</td>
                    <td>KPI summary, recent transactions, inventory levels</td>
                </tr>
                <tr>
                    <td><a href="api/stock.php?type=part_wise" target="_blank">/api/stock.php?type=part_wise</a></td>
                    <td>GET</td>
                    <td>Stock balance aggregated by Part number</td>
                </tr>
                <tr>
                    <td><a href="api/stock.php?type=party_wise" target="_blank">/api/stock.php?type=party_wise</a></td>
                    <td>GET</td>
                    <td>Stock balance grouped by Party/Customer</td>
                </tr>
                <tr>
                    <td><a href="api/stock.php?type=matrix" target="_blank">/api/stock.php?type=matrix</a></td>
                    <td>GET</td>
                    <td>Party x Part live stock cross matrix</td>
                </tr>
                <tr>
                    <td><a href="api/inward.php" target="_blank">/api/inward.php</a></td>
                    <td>GET, POST, DELETE</td>
                    <td>Inward delivery challans & items</td>
                </tr>
                <tr>
                    <td><a href="api/outward.php" target="_blank">/api/outward.php</a></td>
                    <td>GET, POST, DELETE</td>
                    <td>Outward delivery challans & items</td>
                </tr>
                <tr>
                    <td><a href="api/parties.php" target="_blank">/api/parties.php</a></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Parties (Suppliers/Clients) master</td>
                </tr>
                <tr>
                    <td><a href="api/parts.php" target="_blank">/api/parts.php</a></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Parts / Components master</td>
                </tr>
                <tr>
                    <td><a href="api/setup.php" target="_blank">/api/setup.php</a></td>
                    <td>GET, POST</td>
                    <td>1-Click DB Schema installation & initial seeder</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>

