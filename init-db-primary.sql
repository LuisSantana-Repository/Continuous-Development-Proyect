-- ./init-db-primary.sql
CREATE DATABASE IF NOT EXISTS `my-sql-rds-hot`;
USE `my-sql-rds-hot`;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `INE` VARCHAR(500),
  `provider` BOOLEAN DEFAULT FALSE,
  `Foto` VARCHAR(500),
  `address` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tipos de servicio
CREATE TABLE IF NOT EXISTS `ServiceType` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type_name` VARCHAR(100) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS `providers` (
  `provider_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `workname` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `base_price` DECIMAL(10, 2),
  `Service_Type` INT NOT NULL,
  `Job_Permit` VARCHAR(500),
  `IMAGE` VARCHAR(500),
  `address` VARCHAR(255),
  `Time_Available` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (Service_Type) REFERENCES ServiceType(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_service_type (Service_Type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de solicitudes de servicio
CREATE TABLE IF NOT EXISTS `service_requests` (
  `request_id` VARCHAR(36) PRIMARY KEY,
  `provider_id` INT NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `status` ENUM(
    'pending',
    'accepted',
    'rejected',
    'in_progress',
    'completed'
  ) NOT NULL DEFAULT 'pending',
  `description` TEXT,
  `preferred_date` DATETIME,
  `address` TEXT,
  `contact_phone` VARCHAR(20),
  `amount` DECIMAL(10, 2),
  `payment_status` ENUM(
    'pending',
    'paid'
  ) DEFAULT 'pending',
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_provider_id (provider_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reseñas de usuarios
CREATE TABLE IF NOT EXISTS `user_reviews` (
  `review_id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `provider_id` INT NOT NULL,
  `service_request_id` VARCHAR(36),
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(request_id) ON DELETE SET NULL,
  UNIQUE KEY unique_review_per_request (user_id, service_request_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reseñas de proveedores hacia clientes
CREATE TABLE IF NOT EXISTS `provider_reviews` (
  `review_id` VARCHAR(36) PRIMARY KEY,
  `provider_id` INT NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `service_request_id` VARCHAR(36),
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(request_id) ON DELETE SET NULL,
  UNIQUE KEY unique_provider_review_per_request (provider_id, service_request_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reportes de clientes hacia proveedores
CREATE TABLE IF NOT EXISTS `user_reports` (
  `report_id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `service_request_id` VARCHAR(36) NOT NULL,
  `report_message` TEXT NOT NULL,
  `status` ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(request_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_report_per_request (user_id, service_request_id),
  INDEX idx_user_id (user_id),
  INDEX idx_service_request_id (service_request_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reportes de proveedores hacia clientes
CREATE TABLE IF NOT EXISTS `provider_reports` (
  `report_id` VARCHAR(36) PRIMARY KEY,
  `provider_id` INT NOT NULL,
  `service_request_id` VARCHAR(36) NOT NULL,
  `report_message` TEXT NOT NULL,
  `status` ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(request_id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_report_per_request (provider_id, service_request_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_service_request_id (service_request_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `ServiceType` (`type_name`) VALUES 
('Plumbing'),
('Electrical'),
('Cleaning'),
('Carpentry'),
('Landscaping'),
('Painting'),
('Moving'),
('Pest Control'),
('HVAC'),
('Roofing'),
('Flooring'),
('Appliance Repair'),
('Locksmith'),
('Window Cleaning'),
('Gutter Cleaning'),
('Snow Removal'),
('Handyman Services'),
('Interior Design'),
('Home Inspection'),
('Pool Maintenance'),
('Fencing'),
('Deck Building'),
('Masonry'),
('Tiling'),
('Wallpapering'),
('Upholstery Cleaning'),
('Pressure Washing'),
('Solar Panel Installation'),
('Smart Home Installation'),
('Waterproofing'),
('Demolition'),
('Concrete Services'),
('Irrigation Systems'),
('Tree Services'),
('Audio/Visual Installation'),
('Cabinet Installation'),
('Countertop Installation'),
('Bathroom Remodeling'),
('Kitchen Remodeling'),
('Basement Finishing'),
('Home Automation'),
('Security System Installation'),
('Fireplace Installation'),
('Custom Furniture Making'),
('Event Setup Services'),
('Junk Removal Services')
ON DUPLICATE KEY UPDATE type_name=type_name;