<?php
// backend/api/setup.php - Auto-installer and database seeder
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $rawPdo = $db->getRawConnection();
    $dbName = $db->getDbName();

    // Create database if not exists
    $rawPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $rawPdo->exec("USE `{$dbName}`");

    $schemaFile = __DIR__ . '/../database/schema.sql';
    if (!file_exists($schemaFile)) {
        sendResponse(500, [
            "status" => "error",
            "message" => "schema.sql file not found at " . $schemaFile
        ]);
    }

    $sql = file_get_contents($schemaFile);

    // Split SQL by semicolon, but preserve multiline statements safely
    $rawPdo->exec($sql);

    // Ensure machine_rejection and forging_rejection columns exist if table was already created
    try {
        $rawPdo->exec("ALTER TABLE `outward_items` ADD COLUMN `machine_rejection` DECIMAL(12, 3) DEFAULT 0.00 AFTER `quantity`");
    } catch (Exception $e) {}
    try {
        $rawPdo->exec("ALTER TABLE `outward_items` ADD COLUMN `forging_rejection` DECIMAL(12, 3) DEFAULT 0.00 AFTER `machine_rejection`");
    } catch (Exception $e) {}

    // Query counts to confirm
    $stmt1 = $rawPdo->query("SELECT COUNT(*) as count FROM parties");
    $partiesCount = $stmt1->fetchColumn();

    $stmt2 = $rawPdo->query("SELECT COUNT(*) as count FROM parts");
    $partsCount = $stmt2->fetchColumn();

    $stmt3 = $rawPdo->query("SELECT COUNT(*) as count FROM inward_challans");
    $inwardCount = $stmt3->fetchColumn();

    $stmt4 = $rawPdo->query("SELECT COUNT(*) as count FROM outward_challans");
    $outwardCount = $stmt4->fetchColumn();

    sendResponse(200, [
        "status" => "success",
        "message" => "Database '{$dbName}' and tables successfully created and seeded!",
        "stats" => [
            "parties" => (int)$partiesCount,
            "parts" => (int)$partsCount,
            "inward_challans" => (int)$inwardCount,
            "outward_challans" => (int)$outwardCount
        ]
    ]);
} catch (Exception $e) {
    sendResponse(500, [
        "status" => "error",
        "message" => "Setup failed: " . $e->getMessage()
    ]);
}

