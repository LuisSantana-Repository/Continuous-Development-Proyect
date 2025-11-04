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
  `Latitude` DECIMAL(10, 8),
  `Longitude` DECIMAL(11, 8),
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
  `Latitude` DECIMAL(10, 8),
  `Longitude` DECIMAL(11, 8),
  `Time_Available` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (Service_Type) REFERENCES ServiceType(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_service_type (Service_Type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Insertar usuario de prueba (password: "test123")
INSERT INTO `users` (
  `user_id`, 
  `email`, 
  `password_hash`, 
  `username`, 
  `provider`, 
  `Latitude`, 
  `Longitude`
) VALUES (
  'test-user-123',
  'test@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5Ru4FqY6ue8zG', -- hash de "test123"
  'Test User',
  FALSE,
  20.6737777,
  -103.4054536
) ON DUPLICATE KEY UPDATE email=email;

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