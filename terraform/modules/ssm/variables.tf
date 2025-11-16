variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "api_env_vars" {
  description = "Environment variables for API service"
  type        = map(string)
  default     = {}
}

variable "web_env_vars" {
  description = "Environment variables for Web service"
  type        = map(string)
  default     = {}
}

variable "sensitive_keys" {
  description = "List of keys that should be stored as SecureString"
  type        = list(string)
  default = [
    "DB_PRIMARY_PASSWORD",
    "DB_SECONDARY_PASSWORD",
    "JWT_SECRET",
    "API_KEY",
    "SECRET_KEY",
    "PASSWORD",
    "TOKEN"
  ]
}
