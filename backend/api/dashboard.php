<?php
// backend/api/dashboard.php - CNC Workshop Analytics & Overview API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();

try {
    // 1. Total counts
    $partiesCount = (int)$conn->query("SELECT COUNT(*) FROM parties")->fetchColumn();
    $partsCount = (int)$conn->query("SELECT COUNT(*) FROM parts")->fetchColumn();
    $inwardChallanCount = (int)$conn->query("SELECT COUNT(*) FROM inward_challans")->fetchColumn();
    $outwardChallanCount = (int)$conn->query("SELECT COUNT(*) FROM outward_challans")->fetchColumn();

    // 2. Total Inward Qty and Value
    $inwardTotals = $conn->query("
        SELECT 
            COALESCE(SUM(quantity), 0) as total_inward_qty,
            COALESCE(SUM(amount), 0) as total_inward_val
        FROM inward_items
    ")->fetch();

    // 3. Total Outward Qty and Waste
    $outwardTotals = $conn->query("
        SELECT 
            COALESCE(SUM(quantity), 0) as total_outward_qty,
            COALESCE(SUM(waste_quantity), 0) as total_waste_qty,
            COALESCE(SUM(amount), 0) as total_outward_val
        FROM outward_items
    ")->fetch();

    $totalInwardQty = (float)$inwardTotals['total_inward_qty'];
    $totalOutwardQty = (float)$outwardTotals['total_outward_qty'];
    $totalWasteQty = (float)$outwardTotals['total_waste_qty'];
    $currentFloorStock = $totalInwardQty - ($totalOutwardQty + $totalWasteQty);

    // 4. Recent 5 Inward Challans
    $recentInwards = $conn->query("
        SELECT 
            ic.id, ic.challan_no, ic.challan_date, ic.vehicle_no, ic.process_required,
            p.name as party_name,
            COUNT(ii.id) as item_count,
            COALESCE(SUM(ii.quantity), 0) as total_qty
        FROM inward_challans ic
        JOIN parties p ON ic.party_id = p.id
        LEFT JOIN inward_items ii ON ic.id = ii.inward_id
        GROUP BY ic.id
        ORDER BY ic.challan_date DESC, ic.id DESC
        LIMIT 5
    ")->fetchAll();

    // 5. Recent 5 Outward Challans
    $recentOutwards = $conn->query("
        SELECT 
            oc.id, oc.challan_no, oc.challan_date, oc.vehicle_no, oc.process_carried_out,
            p.name as party_name,
            COUNT(oi.id) as item_count,
            COALESCE(SUM(oi.quantity), 0) as total_qty
        FROM outward_challans oc
        JOIN parties p ON oc.party_id = p.id
        LEFT JOIN outward_items oi ON oc.id = oi.outward_id
        GROUP BY oc.id
        ORDER BY oc.challan_date DESC, oc.id DESC
        LIMIT 5
    ")->fetchAll();

    // 6. Top Parts Stock
    $topPartsStock = $conn->query("
        SELECT 
            p.part_no, p.description, p.grade,
            COALESCE(SUM(ii.quantity), 0) as inward_qty,
            COALESCE(outward_data.out_qty, 0) as outward_qty,
            (COALESCE(SUM(ii.quantity), 0) - COALESCE(outward_data.out_qty, 0)) as current_stock
        FROM parts p
        LEFT JOIN inward_items ii ON p.id = ii.part_id
        LEFT JOIN (
            SELECT part_id, SUM(quantity + waste_quantity) as out_qty
            FROM outward_items
            GROUP BY part_id
        ) outward_data ON p.id = outward_data.part_id
        GROUP BY p.id
        ORDER BY current_stock DESC
        LIMIT 6
    ")->fetchAll();

    sendResponse(200, [
        "status" => "success",
        "data" => [
            "kpis" => [
                "parties_count" => $partiesCount,
                "parts_count" => $partsCount,
                "inward_challans_count" => $inwardChallanCount,
                "outward_challans_count" => $outwardChallanCount,
                "total_inward_qty" => $totalInwardQty,
                "total_outward_qty" => $totalOutwardQty,
                "total_waste_qty" => $totalWasteQty,
                "current_floor_stock" => $currentFloorStock,
                "total_inward_value" => (float)$inwardTotals['total_inward_val'],
                "total_outward_value" => (float)$outwardTotals['total_outward_val']
            ],
            "recent_inwards" => $recentInwards,
            "recent_outwards" => $recentOutwards,
            "top_parts_stock" => $topPartsStock
        ]
    ]);
} catch (Exception $e) {
    sendResponse(500, [
        "status" => "error",
        "message" => "Dashboard error: " . $e->getMessage()
    ]);
}

