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

variable "subnet_ids" {
  description = "List of subnet IDs for Auto Scaling Groups"
  type        = list(string)
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

variable "iam_instance_profile_name" {
  description = "Name of the IAM instance profile for EC2"
  type        = string
}

variable "lb_public_dns" {
  description = "DNS name of the Load Balancer"
  type        = string
}

variable "ecr_web_url" {
  description = "URL of the ECR repository for Web"
  type        = string
}

variable "aws_region" {
  description = "AWS region for ECR access (Web only)"
  type        = string
}