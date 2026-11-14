<?php
// backend/api/inward.php - Inward Delivery Challans API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 1. Get parts received from a specific party (with available stock)
        if (isset($_GET['action']) && $_GET['action'] === 'party_parts' && !empty($_GET['party_id'])) {
            $pId = $_GET['party_id'];
            $stmt = $conn->prepare("
                SELECT 
                    p.id as part_id,
                    p.part_no,
                    p.description,
                    p.grade,
                    p.hsn_code,
                    p.unit,
                    p.default_rate,
                    COALESCE(SUM(ii.quantity), 0) as total_inward,
                    COALESCE(out_sub.total_outward, 0) as total_outward,
                    (COALESCE(SUM(ii.quantity), 0) - COALESCE(out_sub.total_outward, 0)) as available_stock
                FROM inward_items ii
                JOIN inward_challans ic ON ii.inward_id = ic.id
                JOIN parts p ON ii.part_id = p.id
                LEFT JOIN (
                    SELECT oi.part_id, SUM(oi.quantity + oi.waste_quantity) as total_outward
                    FROM outward_items oi
                    JOIN outward_challans oc ON oi.outward_id = oc.id
                    WHERE oc.party_id = :party_id_sub
                    GROUP BY oi.part_id
                ) out_sub ON p.id = out_sub.part_id
                WHERE ic.party_id = :party_id
                GROUP BY p.id
                ORDER BY p.part_no ASC
            ");
            $stmt->execute([':party_id' => $pId, ':party_id_sub' => $pId]);
            $parts = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $parts]);
        }

        // 2. Get specific Inward Challan lots for a party & part (with heat_no, rate, and remaining stock)
        if (isset($_GET['action']) && $_GET['action'] === 'part_lots' && !empty($_GET['party_id']) && !empty($_GET['part_id'])) {
            $pId = $_GET['party_id'];
            $ptId = $_GET['part_id'];
            $stmt = $conn->prepare("
                SELECT 
                    ii.id as inward_item_id,
                    ic.id as inward_challan_id,
                    ic.challan_no as inward_challan_no,
                    ic.challan_date,
                    ii.part_id,
                    p.part_no,
                    p.description,
                    ii.grade,
                    ii.heat_no,
                    ii.rate,
                    ii.quantity as original_quantity,
                    COALESCE(out_sub.dispatched_qty, 0) as dispatched_quantity,
                    COALESCE(out_sub.waste_qty, 0) as waste_quantity,
                    COALESCE(out_sub.machine_rejection, 0) as machine_rejection,
                    COALESCE(out_sub.forging_rejection, 0) as forging_rejection,
                    (ii.quantity - COALESCE(out_sub.dispatched_qty, 0) - COALESCE(out_sub.waste_qty, 0)) as available_stock,
                    p.unit
                FROM inward_items ii
                JOIN inward_challans ic ON ii.inward_id = ic.id
                JOIN parts p ON ii.part_id = p.id
                LEFT JOIN (
                    SELECT 
                        oi.inward_item_id,
                        SUM(oi.quantity) as dispatched_qty,
                        SUM(oi.waste_quantity) as waste_qty,
                        SUM(COALESCE(oi.machine_rejection, 0)) as machine_rejection,
                        SUM(COALESCE(oi.forging_rejection, 0)) as forging_rejection
                    FROM outward_items oi
                    GROUP BY oi.inward_item_id
                ) out_sub ON ii.id = out_sub.inward_item_id
                WHERE ic.party_id = :party_id AND ii.part_id = :part_id
                ORDER BY ic.challan_date ASC, ic.id ASC
            ");
            $stmt->execute([':party_id' => $pId, ':part_id' => $ptId]);
            $lots = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $lots]);
        }

        if (isset($_GET['id']) && !empty($_GET['id'])) {
            // Get single inward challan with party info and all line items
            $stmt = $conn->prepare("
                SELECT ic.*, 
                       p.name as party_name, p.gstin as party_gstin, p.address as party_address, 
                       p.phone as party_phone, p.state_code as party_state_code
                FROM inward_challans ic
                JOIN parties p ON ic.party_id = p.id
                WHERE ic.id = :id
            ");
            $stmt->execute([':id' => $_GET['id']]);
            $challan = $stmt->fetch();

            if (!$challan) {
                sendResponse(404, ["status" => "error", "message" => "Inward challan not found"]);
            }

            // Fetch line items
            $itemStmt = $conn->prepare("
                SELECT ii.*, p.part_no, p.description as part_description, p.hsn_code as default_hsn, p.unit
                FROM inward_items ii
                JOIN parts p ON ii.part_id = p.id
                WHERE ii.inward_id = :inward_id
                ORDER BY ii.id ASC
            ");
            $itemStmt->execute([':inward_id' => $_GET['id']]);
            $challan['items'] = $itemStmt->fetchAll();

            sendResponse(200, ["status" => "success", "data" => $challan]);
        } else {
            // Get all inward challans
            $query = "
                SELECT 
                    ic.*,
                    p.name as party_name,
                    p.gstin as party_gstin,
                    COUNT(ii.id) as total_items,
                    COALESCE(SUM(ii.quantity), 0) as total_quantity,
                    COALESCE(SUM(ii.amount), 0) as total_amount
                FROM inward_challans ic
                JOIN parties p ON ic.party_id = p.id
                LEFT JOIN inward_items ii ON ic.id = ii.inward_id
                GROUP BY ic.id
                ORDER BY ic.challan_date DESC, ic.id DESC
            ";
            $stmt = $conn->query($query);
            $challans = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $challans]);
        }
        break;

    case 'POST':
        $data = getJsonInput();

        // Validation
        if (empty($data['challan_no'])) {
            sendResponse(400, ["status" => "error", "message" => "Challan No is required"]);
        }
        if (empty($data['challan_date'])) {
            sendResponse(400, ["status" => "error", "message" => "Challan Date is required"]);
        }
        if (empty($data['party_id'])) {
            sendResponse(400, ["status" => "error", "message" => "Party is required"]);
        }
        if (empty($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
            sendResponse(400, ["status" => "error", "message" => "At least one item is required in the inward challan"]);
        }

        try {
            $conn->beginTransaction();

            // Insert into inward_challans
            $stmt = $conn->prepare("
                INSERT INTO inward_challans (challan_no, challan_date, party_id, vehicle_no, eway_bill_no, process_required, remarks)
                VALUES (:challan_no, :challan_date, :party_id, :vehicle_no, :eway_bill_no, :process_required, :remarks)
            ");
            $stmt->execute([
                ':challan_no' => trim($data['challan_no']),
                ':challan_date' => $data['challan_date'],
                ':party_id' => $data['party_id'],
                ':vehicle_no' => !empty($data['vehicle_no']) ? trim($data['vehicle_no']) : null,
                ':eway_bill_no' => !empty($data['eway_bill_no']) ? trim($data['eway_bill_no']) : null,
                ':process_required' => !empty($data['process_required']) ? trim($data['process_required']) : 'BROACHING / CNC TURNING',
                ':remarks' => !empty($data['remarks']) ? trim($data['remarks']) : null
            ]);
            $inwardId = $conn->lastInsertId();
            // Insert line items
            $itemStmt = $conn->prepare("
                INSERT INTO inward_items (inward_id, part_id, grade, heat_no, quantity, rate, amount)
                VALUES (:inward_id, :part_id, :grade, :heat_no, :quantity, :rate, :amount)
            ");

            foreach ($data['items'] as $item) {
                if (empty($item['part_id']) || empty($item['quantity']) || (float)$item['quantity'] <= 0) {
                    continue; // Skip invalid entries
                }
                $qty = (float)$item['quantity'];
                $rate = isset($item['rate']) ? (float)$item['rate'] : 0.00;
                $amount = isset($item['amount']) ? (float)$item['amount'] : ($qty * $rate);

                $itemStmt->execute([
                    ':inward_id' => $inwardId,
                    ':part_id' => $item['part_id'],
                    ':grade' => !empty($item['grade']) ? trim($item['grade']) : null,
                    ':heat_no' => !empty($item['heat_no']) ? trim($item['heat_no']) : null,
                    ':quantity' => $qty,
                    ':rate' => $rate,
                    ':amount' => $amount
                ]);
            }

            $conn->commit();

            sendResponse(201, [
                "status" => "success",
                "message" => "Inward Challan created successfully",
                "data" => ["id" => $inwardId]
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(500, [
                "status" => "error",
                "message" => "Failed to save inward challan: " . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $data = getJsonInput();
            $id = $data['id'] ?? null;
        }
        if (!$id) {
            sendResponse(400, ["status" => "error", "message" => "Challan ID is required"]);
        }

        $stmt = $conn->prepare("DELETE FROM inward_challans WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendResponse(200, ["status" => "success", "message" => "Inward Challan deleted successfully"]);
        break;

    default:
        sendResponse(405, ["status" => "error", "message" => "Method not allowed"]);
        break;
}

