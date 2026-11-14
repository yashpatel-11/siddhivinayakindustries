<?php
// backend/api/parts.php - CNC Parts / Components API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id']) && !empty($_GET['id'])) {
            $stmt = $conn->prepare("SELECT * FROM parts WHERE id = :id");
            $stmt->execute([':id' => $_GET['id']]);
            $part = $stmt->fetch();
            if (!$part) {
                sendResponse(404, ["status" => "error", "message" => "Part not found"]);
            }
            sendResponse(200, ["status" => "success", "data" => $part]);
        } else {
            // Get all parts with calculated inward, outward, and current stock
            $query = "
                SELECT 
                    p.*,
                    COALESCE(inward_data.total_inward, 0) as total_inward,
                    COALESCE(outward_data.total_outward, 0) as total_outward,
                    (COALESCE(inward_data.total_inward, 0) - COALESCE(outward_data.total_outward, 0)) as current_stock
                FROM parts p
                LEFT JOIN (
                    SELECT part_id, SUM(quantity) as total_inward
                    FROM inward_items
                    GROUP BY part_id
                ) inward_data ON p.id = inward_data.part_id
                LEFT JOIN (
                    SELECT part_id, SUM(quantity + waste_quantity) as total_outward
                    FROM outward_items
                    GROUP BY part_id
                ) outward_data ON p.id = outward_data.part_id
                ORDER BY p.part_no ASC
            ";
            $stmt = $conn->query($query);
            $parts = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $parts]);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        if (empty($data['part_no']) || empty($data['description'])) {
            sendResponse(400, ["status" => "error", "message" => "Part number and description are required"]);
        }

        // Check duplicate part_no
        $checkStmt = $conn->prepare("SELECT id FROM parts WHERE part_no = :part_no");
        $checkStmt->execute([':part_no' => trim($data['part_no'])]);
        if ($checkStmt->fetch()) {
            sendResponse(400, ["status" => "error", "message" => "Part number already exists"]);
        }

        $stmt = $conn->prepare("
            INSERT INTO parts (part_no, description, grade, hsn_code, default_rate, unit)
            VALUES (:part_no, :description, :grade, :hsn_code, :default_rate, :unit)
        ");
        $stmt->execute([
            ':part_no' => trim($data['part_no']),
            ':description' => trim($data['description']),
            ':grade' => !empty($data['grade']) ? trim($data['grade']) : null,
            ':hsn_code' => !empty($data['hsn_code']) ? trim($data['hsn_code']) : '73261910',
            ':default_rate' => isset($data['default_rate']) ? (float)$data['default_rate'] : 0.00,
            ':unit' => !empty($data['unit']) ? trim($data['unit']) : 'NOS'
        ]);

        $newId = $conn->lastInsertId();
        sendResponse(201, [
            "status" => "success",
            "message" => "Part created successfully",
            "data" => ["id" => $newId]
        ]);
        break;

    case 'PUT':
        $data = getJsonInput();
        $id = $data['id'] ?? ($_GET['id'] ?? null);
        if (!$id) {
            sendResponse(400, ["status" => "error", "message" => "Part ID is required"]);
        }
        if (empty($data['part_no']) || empty($data['description'])) {
            sendResponse(400, ["status" => "error", "message" => "Part number and description are required"]);
        }

        // Check duplicate part_no for other ids
        $checkStmt = $conn->prepare("SELECT id FROM parts WHERE part_no = :part_no AND id != :id");
        $checkStmt->execute([':part_no' => trim($data['part_no']), ':id' => $id]);
        if ($checkStmt->fetch()) {
            sendResponse(400, ["status" => "error", "message" => "Another part with this part number already exists"]);
        }

        $stmt = $conn->prepare("
            UPDATE parts 
            SET part_no = :part_no, description = :description, grade = :grade,
                hsn_code = :hsn_code, default_rate = :default_rate, unit = :unit
            WHERE id = :id
        ");
        $stmt->execute([
            ':part_no' => trim($data['part_no']),
            ':description' => trim($data['description']),
            ':grade' => !empty($data['grade']) ? trim($data['grade']) : null,
            ':hsn_code' => !empty($data['hsn_code']) ? trim($data['hsn_code']) : '73261910',
            ':default_rate' => isset($data['default_rate']) ? (float)$data['default_rate'] : 0.00,
            ':unit' => !empty($data['unit']) ? trim($data['unit']) : 'NOS',
            ':id' => $id
        ]);

        sendResponse(200, ["status" => "success", "message" => "Part updated successfully"]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $data = getJsonInput();
            $id = $data['id'] ?? null;
        }
        if (!$id) {
            sendResponse(400, ["status" => "error", "message" => "Part ID is required"]);
        }

        try {
            $stmt = $conn->prepare("DELETE FROM parts WHERE id = :id");
            $stmt->execute([':id' => $id]);
            sendResponse(200, ["status" => "success", "message" => "Part deleted successfully"]);
        } catch (PDOException $e) {
            sendResponse(400, [
                "status" => "error",
                "message" => "Cannot delete part because it is referenced in inward or outward challans."
            ]);
        }
        break;

    default:
        sendResponse(405, ["status" => "error", "message" => "Method not allowed"]);
        break;
}

