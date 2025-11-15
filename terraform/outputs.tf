# ============================================
# Load Balancer Outputs
# ============================================

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.lb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = module.lb.alb_zone_id
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = "http://${module.lb.alb_dns_name}"
}

# ============================================
# EC2 Instance Outputs
# ============================================

# output "api_asg_name" {
#   description = "Name of the API Auto Scaling Group"
#   value       = module.ec2.api_asg_name
# }

# output "web_asg_name" {
#   description = "Name of the Web Auto Scaling Group"
#   value       = module.ec2.web_asg_name
# }

# ============================================
# RDS Database Outputs
# ============================================

output "primary_db_endpoint" {
  description = "Endpoint of the primary RDS database"
  value       = module.rds.primary_db_endpoint
}

output "primary_db_address" {
  description = "Address of the primary RDS database"
  value       = module.rds.primary_db_address
}

output "primary_db_name" {
  description = "Database name of the primary RDS"
  value       = module.rds.primary_db_name
}

output "secondary_db_endpoint" {
  description = "Endpoint of the secondary RDS database"
  value       = module.rds.secondary_db_endpoint
}

output "secondary_db_address" {
  description = "Address of the secondary RDS database"
  value       = module.rds.secondary_db_address
}

output "secondary_db_name" {
  description = "Database name of the secondary RDS"
  value       = module.rds.secondary_db_name
}
# ============================================
# S3 Bucket Outputs
# ============================================

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.s3.bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.s3.bucket_arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = module.s3.bucket_domain_name
}

# ============================================
# IAM Outputs
# ============================================

output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = module.iam.ec2_role_name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = module.iam.instance_profile_name
}


# ============================================
# DynamoDB Outputs
# ============================================

output "dynamodb_sessions_table" {
  description = "Name of the DynamoDB sessions table"
  value       = module.dynamodb.sessions_table_name
}

output "dynamodb_chats_table" {
  description = "Name of the DynamoDB chats table"
  value       = module.dynamodb.chats_table_name
}

output "dynamodb_messages_table" {
  description = "Name of the DynamoDB messages table"
  value       = module.dynamodb.messages_table_name
}

output "dynamodb_all_tables" {
  description = "All DynamoDB table names"
  value       = module.dynamodb.all_table_names
}

# ============================================
# Connection Information
# ============================================

output "connection_info" {
  description = "Complete connection information"
  value = {
    application_url = "http://${module.lb.alb_dns_name}"
    primary_db = {
      endpoint = module.rds.primary_db_endpoint
      database = module.rds.primary_db_name
      username = var.db_username
    }
    secondary_db = var.enable_secondary_db ? {
      endpoint = module.rds.secondary_db_endpoint
      database = module.rds.secondary_db_name
      username = var.db_username
    } : null
  }
  sensitive = true
}
