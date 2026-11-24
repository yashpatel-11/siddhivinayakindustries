<?php
// backend/api/inward.php - Inward Delivery Challans API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$workshop = $_GET['workshop'] ?? 'siddhivinayak';

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
                    WHERE oc.party_id = :party_id_sub AND oc.workshop = :ws_sub
                    GROUP BY oi.part_id
                ) out_sub ON p.id = out_sub.part_id
                WHERE ic.party_id = :party_id AND ic.workshop = :ws
                GROUP BY p.id
                ORDER BY p.part_no ASC
            ");
            $stmt->execute([':party_id' => $pId, ':party_id_sub' => $pId, ':ws' => $workshop, ':ws_sub' => $workshop]);
            $parts = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $parts]);
        }

        // 2. Get specific Inward Challan lots for a party & part (with heat_no, rate, and remaining stock)
        if (isset($_GET['action']) && $_GET['action'] === 'part_lots' && !empty($_GET['party_id']) && !empty($_GET['part_id'])) {
            $pId = $_GET['party_id'];
            $ptId = $_GET['part_id'];
            $excludeOutwardId = !empty($_GET['exclude_outward_id']) ? (int)$_GET['exclude_outward_id'] : 0;
            $stmt = $conn->prepare("
                SELECT 
                    CONCAT(ic.id, '_', ii.id) as lot_key,
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
                    JOIN outward_challans oc ON oi.outward_id = oc.id
                    WHERE oc.workshop = :ws_out AND (:exclude_outward_id = 0 OR oi.outward_id != :exclude_outward_id2)
                    GROUP BY oi.inward_item_id
                ) out_sub ON ii.id = out_sub.inward_item_id
                WHERE ic.party_id = :party_id AND ii.part_id = :part_id AND ic.workshop = :ws
                " . (!empty($_GET['only_available']) ? "HAVING available_stock > 0" : "") . "
                ORDER BY ic.challan_date ASC, ic.id ASC
            ");
            $stmt->execute([
                ':party_id' => $pId, 
                ':part_id' => $ptId,
                ':ws' => $workshop,
                ':ws_out' => $workshop,
                ':exclude_outward_id' => $excludeOutwardId,
                ':exclude_outward_id2' => $excludeOutwardId
            ]);
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
            // Get all inward challans for selected workshop
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
                WHERE ic.workshop = :ws
                GROUP BY ic.id
                ORDER BY ic.challan_date DESC, ic.id DESC
            ";
            $stmt = $conn->prepare($query);
            $stmt->execute([':ws' => $workshop]);
            $challans = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $challans]);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $inwardWorkshop = !empty($data['workshop']) ? trim($data['workshop']) : $workshop;

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
                INSERT INTO inward_challans (challan_no, challan_date, party_id, vehicle_no, eway_bill_no, process_required, remarks, workshop)
                VALUES (:challan_no, :challan_date, :party_id, :vehicle_no, :eway_bill_no, :process_required, :remarks, :workshop)
            ");
            $stmt->execute([
                ':challan_no' => trim($data['challan_no']),
                ':challan_date' => $data['challan_date'],
                ':party_id' => $data['party_id'],
                ':vehicle_no' => !empty($data['vehicle_no']) ? trim($data['vehicle_no']) : null,
                ':eway_bill_no' => !empty($data['eway_bill_no']) ? trim($data['eway_bill_no']) : null,
                ':process_required' => !empty($data['process_required']) ? trim($data['process_required']) : 'CNC TURNING',
                ':remarks' => !empty($data['remarks']) ? trim($data['remarks']) : null,
                ':workshop' => $inwardWorkshop
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

    case 'PUT':
        $data = getJsonInput();

        if (empty($data['id'])) {
            sendResponse(400, ["status" => "error", "message" => "Challan ID is required for editing"]);
        }
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
            $inwardId = (int)$data['id'];

            // 1. Update inward_challans header
            $stmt = $conn->prepare("
                UPDATE inward_challans 
                SET challan_no = :challan_no,
                    challan_date = :challan_date,
                    party_id = :party_id,
                    vehicle_no = :vehicle_no,
                    eway_bill_no = :eway_bill_no,
                    process_required = :process_required,
                    remarks = :remarks
                WHERE id = :id
            ");
            $stmt->execute([
                ':id' => $inwardId,
                ':challan_no' => trim($data['challan_no']),
                ':challan_date' => $data['challan_date'],
                ':party_id' => $data['party_id'],
                ':vehicle_no' => !empty($data['vehicle_no']) ? trim($data['vehicle_no']) : null,
                ':eway_bill_no' => !empty($data['eway_bill_no']) ? trim($data['eway_bill_no']) : null,
                ':process_required' => !empty($data['process_required']) ? trim($data['process_required']) : 'CNC TURNING',
                ':remarks' => !empty($data['remarks']) ? trim($data['remarks']) : null
            ]);

            // 2. Keep outward_items.inward_challan_no updated if challan_no changed
            $updOutwardStmt = $conn->prepare("
                UPDATE outward_items oi
                JOIN inward_items ii ON oi.inward_item_id = ii.id
                SET oi.inward_challan_no = :new_challan_no
                WHERE ii.inward_id = :inward_id
            ");
            $updOutwardStmt->execute([
                ':new_challan_no' => trim($data['challan_no']),
                ':inward_id' => $inwardId
            ]);

            // 3. Process line items
            $existingItemStmt = $conn->prepare("SELECT id FROM inward_items WHERE inward_id = :inward_id");
            $existingItemStmt->execute([':inward_id' => $inwardId]);
            $existingItemIds = $existingItemStmt->fetchAll(PDO::FETCH_COLUMN);

            $keptItemIds = [];
            $updateItemStmt = $conn->prepare("
                UPDATE inward_items
                SET part_id = :part_id,
                    grade = :grade,
                    heat_no = :heat_no,
                    quantity = :quantity,
                    rate = :rate,
                    amount = :amount
                WHERE id = :id AND inward_id = :inward_id
            ");

            $insertItemStmt = $conn->prepare("
                INSERT INTO inward_items (inward_id, part_id, grade, heat_no, quantity, rate, amount)
                VALUES (:inward_id, :part_id, :grade, :heat_no, :quantity, :rate, :amount)
            ");

            foreach ($data['items'] as $item) {
                if (empty($item['part_id']) || empty($item['quantity']) || (float)$item['quantity'] <= 0) {
                    continue;
                }
                $qty = (float)$item['quantity'];
                $rate = isset($item['rate']) ? (float)$item['rate'] : 0.00;
                $amount = isset($item['amount']) ? (float)$item['amount'] : ($qty * $rate);
                $itemId = !empty($item['id']) ? (int)$item['id'] : null;

                if ($itemId && in_array($itemId, $existingItemIds)) {
                    $updateItemStmt->execute([
                        ':id' => $itemId,
                        ':inward_id' => $inwardId,
                        ':part_id' => $item['part_id'],
                        ':grade' => !empty($item['grade']) ? trim($item['grade']) : null,
                        ':heat_no' => !empty($item['heat_no']) ? trim($item['heat_no']) : null,
                        ':quantity' => $qty,
                        ':rate' => $rate,
                        ':amount' => $amount
                    ]);
                    $keptItemIds[] = $itemId;
                } else {
                    $insertItemStmt->execute([
                        ':inward_id' => $inwardId,
                        ':part_id' => $item['part_id'],
                        ':grade' => !empty($item['grade']) ? trim($item['grade']) : null,
                        ':heat_no' => !empty($item['heat_no']) ? trim($item['heat_no']) : null,
                        ':quantity' => $qty,
                        ':rate' => $rate,
                        ':amount' => $amount
                    ]);
                    $keptItemIds[] = $conn->lastInsertId();
                }
            }

            // Delete removed items
            $deleteIds = array_diff($existingItemIds, $keptItemIds);
            if (!empty($deleteIds)) {
                $placeholders = implode(',', array_fill(0, count($deleteIds), '?'));
                $deleteStmt = $conn->prepare("DELETE FROM inward_items WHERE id IN ($placeholders)");
                $deleteStmt->execute(array_values($deleteIds));
            }

            $conn->commit();

            sendResponse(200, [
                "status" => "success",
                "message" => "Inward Challan updated successfully",
                "data" => ["id" => $inwardId]
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(500, [
                "status" => "error",
                "message" => "Failed to update inward challan: " . $e->getMessage()
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

