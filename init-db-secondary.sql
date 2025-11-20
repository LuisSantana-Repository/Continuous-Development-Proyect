-- ./init-db-secondary.sql
-- Base de datos secundaria para analytics/logs
CREATE DATABASE IF NOT EXISTS `cold_rds`;
USE `cold_rds`;

-- Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36),
  `action` VARCHAR(100),
  `resource` VARCHAR(200),
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de métricas
CREATE TABLE IF NOT EXISTS `metrics` (
  `metric_id` INT AUTO_INCREMENT PRIMARY KEY,
  `metric_name` VARCHAR(100),
  `metric_value` DECIMAL(15, 2),
  `tags` JSON,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (metric_name),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de búsquedas
CREATE TABLE IF NOT EXISTS `search_logs` (
  `search_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36),
  `search_term` VARCHAR(255),
  `filters` JSON,
  `results_count` INT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabla de pagos
CREATE TABLE IF NOT EXISTS `payment` (
    `payment_id` VARCHAR(36) PRIMARY KEY,
    `request_id` VARCHAR(36) NOT NULL,
    `date` DATETIME NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `cardDetails` JSON NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;