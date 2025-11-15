variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = false
}

variable "enable_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = false
}

variable "enable_lifecycle_rules" {
  description = "Enable lifecycle rules for cost optimization"
  type        = bool
  default     = true
}

variable "enable_notifications" {
  description = "Enable S3 event notifications"
  type        = bool
  default     = false
}

variable "transition_to_ia_days" {
  description = "Days before transitioning to Infrequent Access"
  type        = number
  default     = 90
}

variable "transition_to_glacier_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 180
}

variable "expiration_days" {
  description = "Days before object expiration (0 to disable)"
  type        = number
  default     = 0
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "ec2_role_arn" {
  description = "ARN of the EC2 IAM role for bucket access"
  type        = string
}