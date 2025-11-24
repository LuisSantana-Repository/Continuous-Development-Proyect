variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "stamin-up"
}

# Variables de entorno para la API
variable "api_env_vars" {
  description = "Environment variables for API"
  type        = map(string)
  default = {
    PORT                    = "3000"
    NODE_ENV               = "production"
    JWT_SECRET             = "lorem_ipsum"
    CORS_ORIGIN            = "0.0.0.0"
    REDIS_HOST             = "0.0.0.0"
    REDIS_PORT             = "6379"
  }
}

# Variables de entorno para Stamin-Up
variable "stamin_env_vars" {
  description = "Environment variables for Stamin-Up"
  type        = map(string)
  default = {
    NODE_ENV  = "development"
    NEXT_TELEMETRY_DISABLED=1
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "instance_type_web" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "docker_image_tag" {
  description = "Docker image tag to use from ECR (e.g., latest, v1.0.0, 20231115-120000)"
  type        = string
  default     = "latest"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "lorem_ipsum"
}


variable "api_min_size" {
  description = "Minimum number of API instances"
  type        = number
  default     = 1
}

variable "api_max_size" {
  description = "Maximum number of API instances"
  type        = number
  default     = 3
}

variable "api_desired_capacity" {
  description = "Desired number of API instances"
  type        = number
  default     = 1
}

variable "web_min_size" {
  description = "Minimum number of Web instances"
  type        = number
  default     = 1
}
variable "web_max_size" {
  description = "Maximum number of Web instances"
  type        = number
  default     = 3
}
variable "web_desired_capacity" {
  description = "Desired number of Web instances"
  type        = number
  default     = 1
}


# ============================================
# RDS Configuration
# ============================================

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Master username for RDS databases"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS databases"
  type        = string
  sensitive   = true
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for RDS (high availability)"
  type        = bool
  default     = false  # Set to true for production
}

variable "enable_secondary_db" {
  description = "Enable secondary analytics database"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain RDS backups"
  type        = number
  default     = 7
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instances"
  type        = bool
  default     = false  # Set to true for production
}


# ============================================
# S3 Configuration
# ============================================

variable "s3_environment" {
  description = "Environment name for S3 bucket (appended to bucket name)"
  type        = string
  default     = "prod"
}

variable "s3_enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = false
}

variable "s3_enable_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = false
}

variable "s3_enable_lifecycle_rules" {
  description = "Enable lifecycle rules for cost optimization"
  type        = bool
  default     = true
}

variable "s3_enable_notifications" {
  description = "Enable S3 event notifications"
  type        = bool
  default     = false
}

variable "s3_transition_to_ia_days" {
  description = "Days before transitioning to Infrequent Access storage"
  type        = number
  default     = 90
}

variable "s3_transition_to_glacier_days" {
  description = "Days before transitioning to Glacier storage"
  type        = number
  default     = 180
}

variable "s3_expiration_days" {
  description = "Days before object expiration (0 to disable)"
  type        = number
  default     = 0
}

variable "s3_cors_allowed_origins" {
  description = "List of allowed CORS origins for S3"
  type        = list(string)
  default     = ["*"]
}

variable "iam_instance_profile_name" {
  description = "Name of the IAM instance profile for EC2"
  type        = string
}

variable "dynamodb_environment" {
  description = "Environment name for DynamoDB tables"
  type        = string
  default     = "prod"
}

variable "dynamodb_enable_ttl" {
  description = "Enable TTL for DynamoDB tables"
  type        = bool
  default     = true
}

variable "dynamodb_enable_pitr" {
  description = "Enable Point-In-Time Recovery for DynamoDB tables"
  type        = bool
  default     = false
}

variable "dynamodb_enable_streams" {
  description = "Enable DynamoDB Streams for real-time triggers"
  type        = bool
  default     = false
}
