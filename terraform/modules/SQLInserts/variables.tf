variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Lambda will run"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "rds_security_group_id" {
  description = "Security group ID of RDS instances"
  type        = string
}

variable "primary_db_host" {
  description = "Primary database host endpoint"
  type        = string
}

variable "primary_db_name" {
  description = "Primary database name"
  type        = string
}

variable "secondary_db_host" {
  description = "Secondary database host endpoint (optional)"
  type        = string
  default     = ""
}

variable "secondary_db_name" {
  description = "Secondary database name (optional)"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "primary_sql_file" {
  description = "Path to primary database initialization SQL file"
  type        = string
}

variable "secondary_sql_file" {
  description = "Path to secondary database initialization SQL file"
  type        = string
  default     = ""
}

variable "auto_invoke" {
  description = "Automatically invoke Lambda to initialize databases after creation"
  type        = bool
  default     = true
}

variable "force_reinvoke" {
  description = "Force re-invocation of Lambda (useful for re-initialization)"
  type        = bool
  default     = false
}
