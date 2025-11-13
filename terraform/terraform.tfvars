# terraform/terraform.tfvars
# Terraform variables configuration

# Project Configuration
project_name = "stamin-up"
environment  = "development"  # Changed to development for cost savings
aws_region   = "us-east-1"    # Changed from mx-central-1 (doesn't exist)

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]  # 2 AZs required for RDS multi-AZ
public_subnet_cidrs       = ["10.0.1.0/24", "10.0.2.0/24"]
private_app_subnet_cidrs  = ["10.0.11.0/24", "10.0.12.0/24"]
private_db_subnet_cidrs   = ["10.0.21.0/24", "10.0.22.0/24"]

# Database credentials (use secure values)
db_username = "admin"
db_password = "TressDeAssada.13"

# Database Configuration - 2 databases as requested
db_instance_class_primary   = "db.t3.micro"
db_instance_class_secondary = "db.t3.micro"
enable_secondary_db         = true  # Enable 2nd database

# JWT Secret (use secure value)
jwt_secret = "TressDeAssada.13TressDeAssada.13"

# AMI ID (Amazon Linux 2023) - Leave empty to auto-detect latest
ami_id = ""  # Will auto-detect latest Amazon Linux 2023 AMI

# Instance types - t3.small as requested
instance_type_api = "t3.small"
instance_type_web = "t3.small"

# Auto Scaling Configuration - Max 3 instances, CPU-based scaling
api_min_size         = 1
api_max_size         = 3  # Max 3 as requested
api_desired_capacity = 1
web_min_size         = 1
web_max_size         = 3  # Max 3 as requested
web_desired_capacity = 1

# SSH Key Pair (must exist in AWS)
ssh_key_name = "stamin-up-key.pem"

# Your IP for SSH access (CIDR format)
your_ip = "148.201.186.87/32"

# Cost Optimization
enable_nat_gateway      = false  # Saves ~$48/month
enable_vpc_flow_logs    = false  # Saves on CloudWatch costs
s3_enable_versioning    = false  # Saves on storage costs
dynamodb_enable_pitr    = false  # Saves on backup costs
enable_https            = false  # No SSL certificate needed for dev
enable_cost_optimization = true

# Optional: Domain name for SSL certificate (when enable_https = true)
# domain_name = "yourdomain.com"
