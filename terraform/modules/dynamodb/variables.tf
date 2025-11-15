variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "ec2_role_name" {
  description = "Name of the EC2 IAM role to attach DynamoDB permissions"
  type        = string
}

variable "enable_ttl" {
  description = "Enable Time To Live for automatic item expiration"
  type        = bool
  default     = true
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for backups"
  type        = bool
  default     = false
}

variable "enable_streams" {
  description = "Enable DynamoDB Streams for real-time data changes"
  type        = bool
  default     = false
}
