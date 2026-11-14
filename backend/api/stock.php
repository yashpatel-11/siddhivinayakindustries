<?php
// backend/api/stock.php - Part-wise and Party-wise Stock Management API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$type = $_GET['type'] ?? 'part_wise';

switch ($type) {
    case 'part_wise':
        // Part-wise stock summary across all parties
        $query = "
            SELECT 
                p.id as part_id,
                p.part_no,
                p.description,
                p.grade,
                p.hsn_code,
                p.unit,
                p.default_rate,
                COALESCE(inward_summary.total_inward, 0) as total_inward,
                COALESCE(outward_summary.total_outward, 0) as total_outward,
                COALESCE(outward_summary.total_waste, 0) as total_waste,
                (COALESCE(inward_summary.total_inward, 0) - COALESCE(outward_summary.total_outward, 0) - COALESCE(outward_summary.total_waste, 0)) as current_stock,
                COALESCE(inward_summary.distinct_parties, 0) as parties_count
            FROM parts p
            LEFT JOIN (
                SELECT 
                    ii.part_id, 
                    SUM(ii.quantity) as total_inward,
                    COUNT(DISTINCT ic.party_id) as distinct_parties
                FROM inward_items ii
                JOIN inward_challans ic ON ii.inward_id = ic.id
                GROUP BY ii.part_id
            ) inward_summary ON p.id = inward_summary.part_id
            LEFT JOIN (
                SELECT 
                    oi.part_id, 
                    SUM(oi.quantity) as total_outward,
                    SUM(oi.waste_quantity) as total_waste
                FROM outward_items oi
                JOIN outward_challans oc ON oi.outward_id = oc.id
                GROUP BY oi.part_id
            ) outward_summary ON p.id = outward_summary.part_id
            ORDER BY current_stock DESC, p.part_no ASC
        ";
        $stmt = $conn->query($query);
        $data = $stmt->fetchAll();
        sendResponse(200, ["status" => "success", "type" => "part_wise", "data" => $data]);
        break;

    case 'party_wise':
        // Party-wise stock with grouped parts breakdown
        $partiesQuery = "SELECT id, name, gstin, phone, address FROM parties ORDER BY name ASC";
        $partiesStmt = $conn->query($partiesQuery);
        $parties = $partiesStmt->fetchAll();

        // Query stock partitioned by party and part
        $matrixQuery = "
            SELECT 
                ic.party_id,
                ii.part_id,
                p.part_no,
                p.description,
                p.grade,
                p.unit,
                SUM(ii.quantity) as inward_qty,
                0 as outward_qty,
                0 as waste_qty
            FROM inward_items ii
            JOIN inward_challans ic ON ii.inward_id = ic.id
            JOIN parts p ON ii.part_id = p.id
            GROUP BY ic.party_id, ii.part_id
        ";
        $inwardRows = $conn->query($matrixQuery)->fetchAll();

        $outwardQuery = "
            SELECT 
                oc.party_id,
                oi.part_id,
                SUM(oi.quantity) as outward_qty,
                SUM(oi.waste_quantity) as waste_qty
            FROM outward_items oi
            JOIN outward_challans oc ON oi.outward_id = oc.id
            GROUP BY oc.party_id, oi.part_id
        ";
        $outwardRows = $conn->query($outwardQuery)->fetchAll();

        // Merge inward and outward
        $partyPartMap = [];
        foreach ($inwardRows as $row) {
            $key = $row['party_id'] . '_' . $row['part_id'];
            $partyPartMap[$key] = [
                'party_id' => $row['party_id'],
                'part_id' => $row['part_id'],
                'part_no' => $row['part_no'],
                'description' => $row['description'],
                'grade' => $row['grade'],
                'unit' => $row['unit'],
                'inward_qty' => (float)$row['inward_qty'],
                'outward_qty' => 0.0,
                'waste_qty' => 0.0,
                'current_stock' => (float)$row['inward_qty']
            ];
        }

        foreach ($outwardRows as $row) {
            $key = $row['party_id'] . '_' . $row['part_id'];
            if (isset($partyPartMap[$key])) {
                $partyPartMap[$key]['outward_qty'] += (float)$row['outward_qty'];
                $partyPartMap[$key]['waste_qty'] += (float)$row['waste_qty'];
                $partyPartMap[$key]['current_stock'] -= ((float)$row['outward_qty'] + (float)$row['waste_qty']);
            }
        }

        // Attach to parties
        $result = [];
        foreach ($parties as $party) {
            $pId = $party['id'];
            $partyParts = [];
            $totalStockPieces = 0;

            foreach ($partyPartMap as $item) {
                if ($item['party_id'] == $pId) {
                    $partyParts[] = $item;
                    $totalStockPieces += $item['current_stock'];
                }
            }

            $party['parts'] = $partyParts;
            $party['total_parts_count'] = count($partyParts);
            $party['total_stock_qty'] = $totalStockPieces;
            $result[] = $party;
        }

        sendResponse(200, ["status" => "success", "type" => "party_wise", "data" => $result]);
        break;

    case 'matrix':
        // Flat Party x Part matrix
        $partyId = $_GET['party_id'] ?? null;
        $partId = $_GET['part_id'] ?? null;

        $whereInward = [];
        $whereOutward = [];
        $paramsInward = [];
        $paramsOutward = [];

        if ($partyId) {
            $whereInward[] = "ic.party_id = :p_in_party";
            $whereOutward[] = "oc.party_id = :p_out_party";
            $paramsInward[':p_in_party'] = $partyId;
            $paramsOutward[':p_out_party'] = $partyId;
        }
        if ($partId) {
            $whereInward[] = "ii.part_id = :p_in_part";
            $whereOutward[] = "oi.part_id = :p_out_part";
            $paramsInward[':p_in_part'] = $partId;
            $paramsOutward[':p_out_part'] = $partId;
        }

        $inwardSql = "
            SELECT 
                ic.party_id,
                p_party.name as party_name,
                ii.part_id,
                p.part_no,
                p.description as part_description,
                p.grade,
                p.unit,
                SUM(ii.quantity) as total_inward
            FROM inward_items ii
            JOIN inward_challans ic ON ii.inward_id = ic.id
            JOIN parties p_party ON ic.party_id = p_party.id
            JOIN parts p ON ii.part_id = p.id
            " . (count($whereInward) ? "WHERE " . implode(" AND ", $whereInward) : "") . "
            GROUP BY ic.party_id, ii.part_id
        ";
        $stmtIn = $conn->prepare($inwardSql);
        $stmtIn->execute($paramsInward);
        $inwardRows = $stmtIn->fetchAll();

        $outwardSql = "
            SELECT 
                oc.party_id,
                oi.part_id,
                SUM(oi.quantity) as total_outward,
                SUM(oi.waste_quantity) as total_waste
            FROM outward_items oi
            JOIN outward_challans oc ON oi.outward_id = oc.id
            " . (count($whereOutward) ? "WHERE " . implode(" AND ", $whereOutward) : "") . "
            GROUP BY oc.party_id, oi.part_id
        ";
        $stmtOut = $conn->prepare($outwardSql);
        $stmtOut->execute($paramsOutward);
        $outwardRows = $stmtOut->fetchAll();

        $outMap = [];
        foreach ($outwardRows as $or) {
            $key = $or['party_id'] . '_' . $or['part_id'];
            $outMap[$key] = [
                'total_outward' => (float)$or['total_outward'],
                'total_waste' => (float)$or['total_waste']
            ];
        }

        $matrix = [];
        foreach ($inwardRows as $ir) {
            $key = $ir['party_id'] . '_' . $ir['part_id'];
            $outQty = isset($outMap[$key]) ? $outMap[$key]['total_outward'] : 0.0;
            $wasteQty = isset($outMap[$key]) ? $outMap[$key]['total_waste'] : 0.0;
            $inQty = (float)$ir['total_inward'];
            $current = $inQty - $outQty - $wasteQty;

            $matrix[] = [
                'party_id' => $ir['party_id'],
                'party_name' => $ir['party_name'],
                'part_id' => $ir['part_id'],
                'part_no' => $ir['part_no'],
                'part_description' => $ir['part_description'],
                'grade' => $ir['grade'],
                'unit' => $ir['unit'],
                'total_inward' => $inQty,
                'total_outward' => $outQty,
                'total_waste' => $wasteQty,
                'current_stock' => $current
            ];
        }

        sendResponse(200, ["status" => "success", "type" => "matrix", "data" => $matrix]);
        break;

    case 'ledger':
        // Detailed transaction ledger for a party and/or part
        $partyId = $_GET['party_id'] ?? null;
        $partId = $_GET['part_id'] ?? null;

        if (!$partyId && !$partId) {
            sendResponse(400, ["status" => "error", "message" => "At least party_id or part_id is required for stock ledger"]);
        }

        $transactions = [];

        // Inwards
        $inSql = "
            SELECT 
                'INWARD' as doc_type,
                ic.id as doc_id,
                ic.challan_no,
                ic.challan_date,
                ic.party_id,
                p_party.name as party_name,
                ii.part_id,
                p.part_no,
                p.description as part_description,
                ii.grade,
                ii.heat_no,
                ii.quantity as qty_in,
                0 as qty_out,
                0 as qty_waste,
                ic.vehicle_no,
                ic.process_required as process_name
            FROM inward_items ii
            JOIN inward_challans ic ON ii.inward_id = ic.id
            JOIN parties p_party ON ic.party_id = p_party.id
            JOIN parts p ON ii.part_id = p.id
            WHERE 1=1
        ";
        $inParams = [];
        if ($partyId) {
            $inSql .= " AND ic.party_id = :party_id";
            $inParams[':party_id'] = $partyId;
        }
        if ($partId) {
            $inSql .= " AND ii.part_id = :part_id";
            $inParams[':part_id'] = $partId;
        }

        $stmtIn = $conn->prepare($inSql);
        $stmtIn->execute($inParams);
        $inwards = $stmtIn->fetchAll();

        // Outwards
        $outSql = "
            SELECT 
                'OUTWARD' as doc_type,
                oc.id as doc_id,
                oc.challan_no,
                oc.challan_date,
                oc.party_id,
                p_party.name as party_name,
                oi.part_id,
                p.part_no,
                p.description as part_description,
                p.grade,
                oi.heat_no,
                0 as qty_in,
                oi.quantity as qty_out,
                oi.waste_quantity as qty_waste,
                oc.vehicle_no,
                oc.process_carried_out as process_name
            FROM outward_items oi
            JOIN outward_challans oc ON oi.outward_id = oc.id
            JOIN parties p_party ON oc.party_id = p_party.id
            JOIN parts p ON oi.part_id = p.id
            WHERE 1=1
        ";
        $outParams = [];
        if ($partyId) {
            $outSql .= " AND oc.party_id = :party_id";
            $outParams[':party_id'] = $partyId;
        }
        if ($partId) {
            $outSql .= " AND oi.part_id = :part_id";
            $outParams[':part_id'] = $partId;
        }

        $stmtOut = $conn->prepare($outSql);
        $stmtOut->execute($outParams);
        $outwards = $stmtOut->fetchAll();

        // Merge and sort chronologically
        $all = array_merge($inwards, $outwards);
        usort($all, function($a, $b) {
            $cmp = strcmp($a['challan_date'], $b['challan_date']);
            if ($cmp === 0) {
                return $a['doc_id'] <=> $b['doc_id'];
            }
            return $cmp;
        });

        // Calculate running balance
        $runningBalance = 0;
        foreach ($all as &$tx) {
            $qtyIn = (float)$tx['qty_in'];
            $qtyOut = (float)$tx['qty_out'] + (float)$tx['qty_waste'];
            $runningBalance += ($qtyIn - $qtyOut);
            $tx['running_balance'] = $runningBalance;
        }

        sendResponse(200, [
            "status" => "success", 
            "type" => "ledger", 
            "current_balance" => $runningBalance,
            "data" => $all
        ]);
        break;

    default:
        sendResponse(400, ["status" => "error", "message" => "Invalid type specified. Use 'part_wise', 'party_wise', 'matrix', or 'ledger'."]);
        break;
}

