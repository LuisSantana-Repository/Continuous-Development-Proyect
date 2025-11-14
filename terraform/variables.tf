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
    DB_HOST                = "lorem_ipsum"
    DB_PORT                = "5432"
    DB_NAME                = "lorem_ipsum"
    DB_USER                = "lorem_ipsum"
    DB_PASSWORD            = "lorem_ipsum"
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
    REACT_APP_API_URL      = "0.0.0.0"
    REACT_APP_ENV          = "production"
    REACT_APP_NAME         = "lorem_ipsum"
    REACT_APP_VERSION      = "1.0.0"
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "lorem_ipsum"
}
