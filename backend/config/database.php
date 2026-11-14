<?php
// backend/config/database.php

class Database {
    private $host = "127.0.0.1";
    private $db_name = "siddhivinayak_cnc";
    private $username = "root";
    private $password = "";
    private $port = "3306";
    private $conn = null;

    public function __construct() {
        // Allow overriding via environment variables
        if (getenv('DB_HOST')) $this->host = getenv('DB_HOST');
        if (getenv('DB_NAME')) $this->db_name = getenv('DB_NAME');
        if (getenv('DB_USER')) $this->username = getenv('DB_USER');
        if (getenv('DB_PASS')) $this->password = getenv('DB_PASS');
        if (getenv('DB_PORT')) $this->port = getenv('DB_PORT');
    }

    public function getConnection() {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            // Attempt connection without database name to see if server is up
            try {
                $rawDsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";charset=utf8mb4";
                $testConn = new PDO($rawDsn, $this->username, $this->password);
                // MySQL is up, but database is missing
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "code" => "DATABASE_NOT_INITIALIZED",
                    "message" => "Database '{$this->db_name}' not found on MySQL server. Please run setup.php to create tables and seed data.",
                    "setup_url" => "/backend/api/setup.php"
                ]);
                exit();
            } catch (PDOException $ex) {
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "code" => "MYSQL_CONNECTION_FAILED",
                    "message" => "Cannot connect to MySQL on {$this->host}:{$this->port}. Please ensure MySQL service is running (e.g. XAMPP / MariaDB). Details: " . $e->getMessage()
                ]);
                exit();
            }
        }

        return $this->conn;
    }

    public function getRawConnection() {
        $rawDsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";charset=utf8mb4";
        return new PDO($rawDsn, $this->username, $this->password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
    }

    public function getDbName() {
        return $this->db_name;
    }
}

