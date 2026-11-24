<?php
// backend/api/outward.php - Outward Delivery Challans API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$workshop = $_GET['workshop'] ?? 'siddhivinayak';

switch ($method) {
    case 'GET':
        if (isset($_GET['id']) && !empty($_GET['id'])) {
            // Get single outward challan with party info and line items
            $stmt = $conn->prepare("
                SELECT oc.*, 
                       p.name as party_name, p.gstin as party_gstin, p.address as party_address, 
                       p.phone as party_phone, p.state_code as party_state_code
                FROM outward_challans oc
                JOIN parties p ON oc.party_id = p.id
                WHERE oc.id = :id
            ");
            $stmt->execute([':id' => $_GET['id']]);
            $challan = $stmt->fetch();

            if (!$challan) {
                sendResponse(404, ["status" => "error", "message" => "Outward challan not found"]);
            }

            // Fetch line items
            $itemStmt = $conn->prepare("
                SELECT oi.*, p.part_no, p.description as part_description, p.grade as default_grade, p.hsn_code, p.unit
                FROM outward_items oi
                JOIN parts p ON oi.part_id = p.id
                WHERE oi.outward_id = :outward_id
                ORDER BY oi.id ASC
            ");
            $itemStmt->execute([':outward_id' => $_GET['id']]);
            $challan['items'] = $itemStmt->fetchAll();

            sendResponse(200, ["status" => "success", "data" => $challan]);
        } else {
            // Get all outward challans for selected workshop
            $query = "
                SELECT 
                    oc.*,
                    p.name as party_name,
                    p.gstin as party_gstin,
                    COUNT(oi.id) as total_items,
                    COALESCE(SUM(oi.quantity), 0) as total_quantity,
                    COALESCE(SUM(oi.waste_quantity), 0) as total_waste,
                    COALESCE(SUM(oi.machine_rejection), 0) as total_machine_rejection,
                    COALESCE(SUM(oi.forging_rejection), 0) as total_forging_rejection,
                    COALESCE(SUM(oi.amount), 0) as total_amount,
                    GROUP_CONCAT(DISTINCT prt.part_no ORDER BY prt.part_no SEPARATOR ', ') as part_nos
                FROM outward_challans oc
                JOIN parties p ON oc.party_id = p.id
                LEFT JOIN outward_items oi ON oc.id = oi.outward_id
                LEFT JOIN parts prt ON oi.part_id = prt.id
                WHERE oc.workshop = :ws
                GROUP BY oc.id
                ORDER BY oc.challan_date DESC, oc.id DESC
            ";
            $stmt = $conn->prepare($query);
            $stmt->execute([':ws' => $workshop]);
            $challans = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $challans]);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $outwardWorkshop = !empty($data['workshop']) ? trim($data['workshop']) : $workshop;

        // Auto-generate J-1, J-2 series for the selected workshop if challan_no is empty
        if (empty($data['challan_no'])) {
            $stmt = $conn->prepare("SELECT challan_no FROM outward_challans WHERE workshop = :ws AND challan_no REGEXP '^J-[0-9]+$'");
            $stmt->execute([':ws' => $outwardWorkshop]);
            $maxNum = 0;
            if ($stmt) {
                while ($row = $stmt->fetch()) {
                    if (preg_match('/^J-(\d+)$/i', $row['challan_no'], $matches)) {
                        $num = (int)$matches[1];
                        if ($num > $maxNum) {
                            $maxNum = $num;
                        }
                    }
                }
            }
            $data['challan_no'] = 'J-' . ($maxNum + 1);
        }
        if (empty($data['challan_date'])) {
            sendResponse(400, ["status" => "error", "message" => "Challan Date is required"]);
        }
        if (empty($data['party_id'])) {
            sendResponse(400, ["status" => "error", "message" => "Party is required"]);
        }
        if (empty($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
            sendResponse(400, ["status" => "error", "message" => "At least one item is required in outward challan"]);
        }

        try {
            $conn->beginTransaction();

            // Insert outward_challan
            $stmt = $conn->prepare("
                INSERT INTO outward_challans (challan_no, challan_date, party_id, vehicle_no, eway_bill_no, process_carried_out, remarks, workshop)
                VALUES (:challan_no, :challan_date, :party_id, :vehicle_no, :eway_bill_no, :process_carried_out, :remarks, :workshop)
            ");
            $stmt->execute([
                ':challan_no' => trim($data['challan_no']),
                ':challan_date' => $data['challan_date'],
                ':party_id' => $data['party_id'],
                ':vehicle_no' => !empty($data['vehicle_no']) ? trim($data['vehicle_no']) : null,
                ':eway_bill_no' => !empty($data['eway_bill_no']) ? trim($data['eway_bill_no']) : null,
                ':process_carried_out' => !empty($data['process_carried_out']) ? trim($data['process_carried_out']) : 'CNC TURNING',
                ':remarks' => !empty($data['remarks']) ? trim($data['remarks']) : null,
                ':workshop' => $outwardWorkshop
            ]);

            $outwardId = $conn->lastInsertId();

            // Insert line items
            $itemStmt = $conn->prepare("
                INSERT INTO outward_items (outward_id, part_id, inward_item_id, inward_challan_no, heat_no, quantity, machine_rejection, forging_rejection, waste_quantity, rate, amount)
                VALUES (:outward_id, :part_id, :inward_item_id, :inward_challan_no, :heat_no, :quantity, :machine_rejection, :forging_rejection, :waste_quantity, :rate, :amount)
            ");

            foreach ($data['items'] as $item) {
                if (empty($item['part_id']) || empty($item['quantity']) || (float)$item['quantity'] <= 0) {
                    continue;
                }
                $qty = (float)$item['quantity'];
                $mRej = isset($item['machine_rejection']) ? (float)$item['machine_rejection'] : 0.00;
                $fRej = isset($item['forging_rejection']) ? (float)$item['forging_rejection'] : 0.00;
                $wasteQty = isset($item['waste_quantity']) && (float)$item['waste_quantity'] > 0
                    ? (float)$item['waste_quantity']
                    : ($mRej + $fRej);
                $rate = isset($item['rate']) ? (float)$item['rate'] : 0.00;
                $amount = isset($item['amount']) ? (float)$item['amount'] : ($qty * $rate);

                $itemStmt->execute([
                    ':outward_id' => $outwardId,
                    ':part_id' => $item['part_id'],
                    ':inward_item_id' => !empty($item['inward_item_id']) ? $item['inward_item_id'] : null,
                    ':inward_challan_no' => !empty($item['inward_challan_no']) ? trim($item['inward_challan_no']) : null,
                    ':heat_no' => !empty($item['heat_no']) ? trim($item['heat_no']) : null,
                    ':quantity' => $qty,
                    ':machine_rejection' => $mRej,
                    ':forging_rejection' => $fRej,
                    ':waste_quantity' => $wasteQty,
                    ':rate' => $rate,
                    ':amount' => $amount
                ]);
            }

            $conn->commit();

            sendResponse(201, [
                "status" => "success",
                "message" => "Outward Challan created successfully",
                "data" => ["id" => $outwardId]
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(500, [
                "status" => "error",
                "message" => "Failed to save outward challan: " . $e->getMessage()
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
            sendResponse(400, ["status" => "error", "message" => "At least one item is required in outward challan"]);
        }

        try {
            $conn->beginTransaction();
            $outwardId = (int)$data['id'];

            // 1. Update outward_challans header
            $stmt = $conn->prepare("
                UPDATE outward_challans 
                SET challan_no = :challan_no,
                    challan_date = :challan_date,
                    party_id = :party_id,
                    vehicle_no = :vehicle_no,
                    eway_bill_no = :eway_bill_no,
                    process_carried_out = :process_carried_out,
                    remarks = :remarks
                WHERE id = :id
            ");
            $stmt->execute([
                ':id' => $outwardId,
                ':challan_no' => trim($data['challan_no']),
                ':challan_date' => $data['challan_date'],
                ':party_id' => $data['party_id'],
                ':vehicle_no' => !empty($data['vehicle_no']) ? trim($data['vehicle_no']) : null,
                ':eway_bill_no' => !empty($data['eway_bill_no']) ? trim($data['eway_bill_no']) : null,
                ':process_carried_out' => !empty($data['process_carried_out']) ? trim($data['process_carried_out']) : 'CNC TURNING',
                ':remarks' => !empty($data['remarks']) ? trim($data['remarks']) : null
            ]);

            // 2. Refresh line items
            $delStmt = $conn->prepare("DELETE FROM outward_items WHERE outward_id = :outward_id");
            $delStmt->execute([':outward_id' => $outwardId]);

            $itemStmt = $conn->prepare("
                INSERT INTO outward_items (outward_id, part_id, inward_item_id, inward_challan_no, heat_no, quantity, machine_rejection, forging_rejection, waste_quantity, rate, amount)
                VALUES (:outward_id, :part_id, :inward_item_id, :inward_challan_no, :heat_no, :quantity, :machine_rejection, :forging_rejection, :waste_quantity, :rate, :amount)
            ");

            foreach ($data['items'] as $item) {
                if (empty($item['part_id'])) {
                    continue;
                }
                $qty = isset($item['quantity']) ? (float)$item['quantity'] : 0.00;
                $mRej = isset($item['machine_rejection']) ? (float)$item['machine_rejection'] : 0.00;
                $fRej = isset($item['forging_rejection']) ? (float)$item['forging_rejection'] : 0.00;
                if ($qty <= 0 && $mRej <= 0 && $fRej <= 0) {
                    continue;
                }
                $wasteQty = isset($item['waste_quantity']) && (float)$item['waste_quantity'] > 0
                    ? (float)$item['waste_quantity']
                    : ($mRej + $fRej);
                $rate = isset($item['rate']) ? (float)$item['rate'] : 0.00;
                $amount = isset($item['amount']) ? (float)$item['amount'] : ($qty * $rate);

                $itemStmt->execute([
                    ':outward_id' => $outwardId,
                    ':part_id' => $item['part_id'],
                    ':inward_item_id' => !empty($item['inward_item_id']) ? $item['inward_item_id'] : null,
                    ':inward_challan_no' => !empty($item['inward_challan_no']) ? trim($item['inward_challan_no']) : null,
                    ':heat_no' => !empty($item['heat_no']) ? trim($item['heat_no']) : null,
                    ':quantity' => $qty,
                    ':machine_rejection' => $mRej,
                    ':forging_rejection' => $fRej,
                    ':waste_quantity' => $wasteQty,
                    ':rate' => $rate,
                    ':amount' => $amount
                ]);
            }

            $conn->commit();

            sendResponse(200, [
                "status" => "success",
                "message" => "Outward Challan updated successfully",
                "data" => ["id" => $outwardId]
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(500, [
                "status" => "error",
                "message" => "Failed to update outward challan: " . $e->getMessage()
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

        $stmt = $conn->prepare("DELETE FROM outward_challans WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendResponse(200, ["status" => "success", "message" => "Outward Challan deleted successfully"]);
        break;

    default:
        sendResponse(405, ["status" => "error", "message" => "Method not allowed"]);
        break;
}

