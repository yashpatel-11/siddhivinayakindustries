<?php
// backend/api/parties.php - Parties / Customers / Jobwork Providers API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id']) && !empty($_GET['id'])) {
            $stmt = $conn->prepare("SELECT * FROM parties WHERE id = :id");
            $stmt->execute([':id' => $_GET['id']]);
            $party = $stmt->fetch();
            if (!$party) {
                sendResponse(404, ["status" => "error", "message" => "Party not found"]);
            }
            sendResponse(200, ["status" => "success", "data" => $party]);
        } else {
            // Get all parties with counts of inward challans
            $query = "
                SELECT 
                    p.*,
                    (SELECT COUNT(*) FROM inward_challans ic WHERE ic.party_id = p.id) as total_inwards,
                    (SELECT COUNT(*) FROM outward_challans oc WHERE oc.party_id = p.id) as total_outwards
                FROM parties p
                ORDER BY p.name ASC
            ";
            $stmt = $conn->query($query);
            $parties = $stmt->fetchAll();
            sendResponse(200, ["status" => "success", "data" => $parties]);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        if (empty($data['name'])) {
            sendResponse(400, ["status" => "error", "message" => "Party name is required"]);
        }

        $stmt = $conn->prepare("
            INSERT INTO parties (name, gstin, address, phone, state_code)
            VALUES (:name, :gstin, :address, :phone, :state_code)
        ");
        $stmt->execute([
            ':name' => trim($data['name']),
            ':gstin' => !empty($data['gstin']) ? strtoupper(trim($data['gstin'])) : null,
            ':address' => !empty($data['address']) ? trim($data['address']) : null,
            ':phone' => !empty($data['phone']) ? trim($data['phone']) : null,
            ':state_code' => !empty($data['state_code']) ? trim($data['state_code']) : '24-Gujarat'
        ]);

        $newId = $conn->lastInsertId();
        sendResponse(201, [
            "status" => "success",
            "message" => "Party created successfully",
            "data" => ["id" => $newId]
        ]);
        break;

    case 'PUT':
        $data = getJsonInput();
        $id = $data['id'] ?? ($_GET['id'] ?? null);
        if (!$id) {
            sendResponse(400, ["status" => "error", "message" => "Party ID is required for update"]);
        }
        if (empty($data['name'])) {
            sendResponse(400, ["status" => "error", "message" => "Party name is required"]);
        }

        $stmt = $conn->prepare("
            UPDATE parties 
            SET name = :name, gstin = :gstin, address = :address, phone = :phone, state_code = :state_code
            WHERE id = :id
        ");
        $stmt->execute([
            ':name' => trim($data['name']),
            ':gstin' => !empty($data['gstin']) ? strtoupper(trim($data['gstin'])) : null,
            ':address' => !empty($data['address']) ? trim($data['address']) : null,
            ':phone' => !empty($data['phone']) ? trim($data['phone']) : null,
            ':state_code' => !empty($data['state_code']) ? trim($data['state_code']) : '24-Gujarat',
            ':id' => $id
        ]);

        sendResponse(200, ["status" => "success", "message" => "Party updated successfully"]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $data = getJsonInput();
            $id = $data['id'] ?? null;
        }
        if (!$id) {
            sendResponse(400, ["status" => "error", "message" => "Party ID is required"]);
        }

        $stmt = $conn->prepare("DELETE FROM parties WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendResponse(200, ["status" => "success", "message" => "Party deleted successfully"]);
        break;

    default:
        sendResponse(405, ["status" => "error", "message" => "Method not allowed"]);
        break;
}

