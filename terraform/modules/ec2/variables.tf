variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "app_sg_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the load balancer"
  type        = string
}

variable "api_env_vars" {
  description = "Environment variables for API"
  type        = map(string)
}

variable "stamin_env_vars" {
  description = "Environment variables for Stamin-Up"
  type        = map(string)
}

variable "web_target_group_arn" {
  description = "ARN of the web target group"
  type        = string
}

variable "api_target_group_arn" {
  description = "ARN of the API target group"
  type        = string
}
