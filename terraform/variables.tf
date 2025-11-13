# terraform/variables.tf
# VERSIÓN OPTIMIZADA - Con variables para control de costos

# ========================================
# CONFIGURACIÓN GENERAL
# ========================================

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"  # Cambiado de mx-central-1 (no existe) a us-east-1
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "stamin-up"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

# ========================================
# CONFIGURACIÓN DE RED
# ========================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones (1 para dev, 2+ para prod)"
  type        = list(string)
  default     = ["us-east-1a"]  # Solo 1 AZ en desarrollo para ahorrar costos
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24"]  # Solo 1 para desarrollo
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private application subnets"
  type        = list(string)
  default     = ["10.0.11.0/24"]  # Solo 1 para desarrollo
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]  # Mínimo 2 para RDS
}

# OPTIMIZACIÓN: Control de NAT Gateway
variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (false ahorra ~$48/mes)"
  type        = bool
  default     = false  # Deshabilitado por defecto en desarrollo
}

# OPTIMIZACIÓN: VPC Flow Logs
variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs (solo para debugging)"
  type        = bool
  default     = false
}

# ========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ========================================

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password (mínimo 8 caracteres)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters long."
  }
}

variable "db_instance_class_primary" {
  description = "RDS instance class for primary database"
  type        = string
  default     = "db.t3.micro"  # Más barato disponible
}

variable "db_instance_class_secondary" {
  description = "RDS instance class for secondary database"
  type        = string
  default     = "db.t3.micro"
}

# OPTIMIZACIÓN: Control de segunda base de datos
variable "enable_secondary_db" {
  description = "Enable secondary database (false ahorra ~$33-65/mes)"
  type        = bool
  default     = false  # Deshabilitado por defecto
}

# ========================================
# CONFIGURACIÓN DE EC2
# ========================================

variable "ami_id" {
  description = "AMI ID for EC2 instances (Amazon Linux 2023)"
  type        = string
  # Dejar vacío y especificar en terraform.tfvars
  # O usar data source para obtener la última AMI automáticamente
}

variable "instance_type_api" {
  description = "EC2 instance type for API servers"
  type        = string
  default     = "t3.micro"  # Free tier eligible
}

variable "instance_type_web" {
  description = "EC2 instance type for Web servers"
  type        = string
  default     = "t3.micro"  # Free tier eligible
}

variable "ssh_key_name" {
  description = "SSH key pair name for EC2 access"
  type        = string
  # Especificar en terraform.tfvars
}

variable "your_ip" {
  description = "Your IP address for SSH access (CIDR format: x.x.x.x/32)"
  type        = string
  # Especificar en terraform.tfvars
  
  validation {
    condition     = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$", var.your_ip))
    error_message = "Must be a valid CIDR notation (e.g., 1.2.3.4/32)."
  }
}

# ========================================
# AUTO SCALING CONFIGURATION
# ========================================

variable "api_min_size" {
  description = "Minimum number of API instances"
  type        = number
  default     = 1  # Reducido de 2 para ahorrar costos
}

variable "api_max_size" {
  description = "Maximum number of API instances"
  type        = number
  default     = 4
}

variable "api_desired_capacity" {
  description = "Desired number of API instances"
  type        = number
  default     = 1  # Reducido de 2 para ahorrar costos
}

variable "web_min_size" {
  description = "Minimum number of Web instances"
  type        = number
  default     = 1  # Reducido de 2 para ahorrar costos
}

variable "web_max_size" {
  description = "Maximum number of Web instances"
  type        = number
  default     = 4
}

variable "web_desired_capacity" {
  description = "Desired number of Web instances"
  type        = number
  default     = 1  # Reducido de 2 para ahorrar costos
}

# ========================================
# CONFIGURACIÓN DE SEGURIDAD
# ========================================

variable "jwt_secret" {
  description = "JWT secret for application (mínimo 32 caracteres)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT secret must be at least 32 characters long."
  }
}

# ========================================
# CONFIGURACIÓN DE HTTPS/SSL
# ========================================

variable "enable_https" {
  description = "Enable HTTPS with ACM certificate (requiere domain_name)"
  type        = bool
  default     = false  # Deshabilitado por defecto para desarrollo
}

variable "domain_name" {
  description = "Domain name for ACM certificate (ej: example.com)"
  type        = string
  default     = ""
  
  validation {
    condition     = var.domain_name == "" || can(regex("^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\\.[a-z]{2,}$", var.domain_name))
    error_message = "Must be a valid domain name or empty string."
  }
}

# ========================================
# CONFIGURACIÓN DE S3
# ========================================

variable "s3_enable_versioning" {
  description = "Enable S3 bucket versioning (aumenta costos de storage)"
  type        = bool
  default     = false  # Deshabilitado por defecto en desarrollo
}

# ========================================
# CONFIGURACIÓN DE DYNAMODB
# ========================================

variable "dynamodb_enable_pitr" {
  description = "Enable Point-in-Time Recovery for DynamoDB (cuesta extra)"
  type        = bool
  default     = false  # Deshabilitado por defecto para ahorrar
}

# ========================================
# TAGS COMUNES
# ========================================

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "StaminUp"
  }
}

# ========================================
# CONFIGURACIÓN DE COSTOS
# ========================================

variable "enable_cost_optimization" {
  description = "Enable aggressive cost optimization (para desarrollo)"
  type        = bool
  default     = true
}

# ========================================
# DEPRECATED VARIABLES (mantener por compatibilidad)
# ========================================

variable "db_primary_name" {
  description = "Primary database name (deprecated, usar db_name en resource)"
  type        = string
  default     = "my_sql_rds_hot"
}

variable "db_secondary_name" {
  description = "Secondary database name (deprecated)"
  type        = string
  default     = "analytics_db"
}

variable "db_instance_class" {
  description = "RDS instance class (deprecated, usar db_instance_class_primary)"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type (deprecated, usar instance_type_api/web)"
  type        = string
  default     = "t3.micro"
}

variable "ec2_desired_capacity" {
  description = "Desired number of EC2 instances (deprecated)"
  type        = number
  default     = 1
}

variable "ec2_min_size" {
  description = "Minimum number of EC2 instances (deprecated)"
  type        = number
  default     = 1
}

variable "ec2_max_size" {
  description = "Maximum number of EC2 instances (deprecated)"
  type        = number
  default     = 4
}

variable "s3_bucket_name" {
  description = "S3 bucket name (deprecated, auto-generated now)"
  type        = string
  default     = ""
}
