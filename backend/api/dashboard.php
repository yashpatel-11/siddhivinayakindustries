<?php
// backend/api/dashboard.php - CNC Workshop Analytics & Overview API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();

try {
    $workshop = $_GET['workshop'] ?? 'siddhivinayak';

    // 1. Total counts
    $partiesCount = (int)$conn->query("SELECT COUNT(*) FROM parties")->fetchColumn();
    $partsCount = (int)$conn->query("SELECT COUNT(*) FROM parts")->fetchColumn();
    
    $inCountStmt = $conn->prepare("SELECT COUNT(*) FROM inward_challans WHERE workshop = :ws");
    $inCountStmt->execute([':ws' => $workshop]);
    $inwardChallanCount = (int)$inCountStmt->fetchColumn();

    $outCountStmt = $conn->prepare("SELECT COUNT(*) FROM outward_challans WHERE workshop = :ws");
    $outCountStmt->execute([':ws' => $workshop]);
    $outwardChallanCount = (int)$outCountStmt->fetchColumn();

    // 2. Total Inward Qty and Value for selected workshop
    $inTotalsStmt = $conn->prepare("
        SELECT 
            COALESCE(SUM(ii.quantity), 0) as total_inward_qty,
            COALESCE(SUM(ii.amount), 0) as total_inward_val
        FROM inward_items ii
        JOIN inward_challans ic ON ii.inward_id = ic.id
        WHERE ic.workshop = :ws
    ");
    $inTotalsStmt->execute([':ws' => $workshop]);
    $inwardTotals = $inTotalsStmt->fetch();

    // 3. Total Outward Qty and Waste for selected workshop
    $outTotalsStmt = $conn->prepare("
        SELECT 
            COALESCE(SUM(oi.quantity), 0) as total_outward_qty,
            COALESCE(SUM(oi.waste_quantity), 0) as total_waste_qty,
            COALESCE(SUM(oi.amount), 0) as total_outward_val
        FROM outward_items oi
        JOIN outward_challans oc ON oi.outward_id = oc.id
        WHERE oc.workshop = :ws
    ");
    $outTotalsStmt->execute([':ws' => $workshop]);
    $outwardTotals = $outTotalsStmt->fetch();

    $totalInwardQty = (float)$inwardTotals['total_inward_qty'];
    $totalOutwardQty = (float)$outwardTotals['total_outward_qty'];
    $totalWasteQty = (float)$outwardTotals['total_waste_qty'];
    $currentFloorStock = $totalInwardQty - ($totalOutwardQty + $totalWasteQty);

    // 4. Recent 5 Inward Challans
    $recentInStmt = $conn->prepare("
        SELECT 
            ic.id, ic.challan_no, ic.challan_date, ic.vehicle_no, ic.process_required, ic.workshop,
            p.name as party_name,
            COUNT(ii.id) as item_count,
            COALESCE(SUM(ii.quantity), 0) as total_qty
        FROM inward_challans ic
        JOIN parties p ON ic.party_id = p.id
        LEFT JOIN inward_items ii ON ic.id = ii.inward_id
        WHERE ic.workshop = :ws
        GROUP BY ic.id
        ORDER BY ic.challan_date DESC, ic.id DESC
        LIMIT 5
    ");
    $recentInStmt->execute([':ws' => $workshop]);
    $recentInwards = $recentInStmt->fetchAll();

    // 5. Recent 5 Outward Challans
    $recentOutStmt = $conn->prepare("
        SELECT 
            oc.id, oc.challan_no, oc.challan_date, oc.vehicle_no, oc.process_carried_out, oc.workshop,
            p.name as party_name,
            COUNT(oi.id) as item_count,
            COALESCE(SUM(oi.quantity), 0) as total_qty
        FROM outward_challans oc
        JOIN parties p ON oc.party_id = p.id
        LEFT JOIN outward_items oi ON oc.id = oi.outward_id
        WHERE oc.workshop = :ws
        GROUP BY oc.id
        ORDER BY oc.challan_date DESC, oc.id DESC
        LIMIT 5
    ");
    $recentOutStmt->execute([':ws' => $workshop]);
    $recentOutwards = $recentOutStmt->fetchAll();

    // 6. Top Parts Stock
    $topPartsStmt = $conn->prepare("
        SELECT 
            p.part_no, p.description, p.grade,
            COALESCE(inward_data.in_qty, 0) as inward_qty,
            COALESCE(outward_data.out_qty, 0) as outward_qty,
            (COALESCE(inward_data.in_qty, 0) - COALESCE(outward_data.out_qty, 0)) as current_stock
        FROM parts p
        LEFT JOIN (
            SELECT ii.part_id, SUM(ii.quantity) as in_qty
            FROM inward_items ii
            JOIN inward_challans ic ON ii.inward_id = ic.id
            WHERE ic.workshop = :ws1
            GROUP BY ii.part_id
        ) inward_data ON p.id = inward_data.part_id
        LEFT JOIN (
            SELECT oi.part_id, SUM(oi.quantity + oi.waste_quantity) as out_qty
            FROM outward_items oi
            JOIN outward_challans oc ON oi.outward_id = oc.id
            WHERE oc.workshop = :ws2
            GROUP BY oi.part_id
        ) outward_data ON p.id = outward_data.part_id
        GROUP BY p.id
        ORDER BY current_stock DESC
        LIMIT 6
    ");
    $topPartsStmt->execute([':ws1' => $workshop, ':ws2' => $workshop]);
    $topPartsStock = $topPartsStmt->fetchAll();

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

