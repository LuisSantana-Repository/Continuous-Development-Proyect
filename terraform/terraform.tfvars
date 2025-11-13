# terraform/terraform.tfvars.example
# Copiar este archivo a terraform.tfvars y completar con tus valores

vpc_cidr           = "10.0.0.0/16"
# Database credentials (usar valores seguros)
db_username = "admin"
db_password = "TressDeAssada.13"

# JWT Secret (usar valor seguro)
jwt_secret = "TressDeAssada.13TressDeAssada.13"

# AMI ID (Amazon Linux 2023) - Actualizar según región
ami_id = "ami-0a5d29b8cde5d1441"

# Instance types
instance_type_api = "t3.micro"
instance_type_web = "t3.micro"


# SSH Key Pair (debe existir en AWS)
ssh_key_name = "stamin-up-key.pem"

# Your IP for SSH access (formato CIDR)
your_ip = "148.201.186.87/32"

# Project Configuration
project_name = "stamin-up"
environment  = "production"
aws_region   = "mx-central-1"

# Network Configuration
availability_zones   = ["mx-central-1a"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_app_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
private_db_subnet_cidrs  = ["10.0.21.0/24", "10.0.22.0/24"]

# Database Configuration
db_primary_name   = "my-sql-rds-hot"
db_secondary_name = "analytics_db"
db_instance_class = "db.t3.micro"
db_instance_class_primary = "db.t3.micro"
db_instance_class_secondary = "db.t3.micro"

# EC2 Configuration
ec2_instance_type     = "t3.micro"
ec2_desired_capacity  = 2
ec2_min_size          = 1
ec2_max_size          = 4

# Optional: Domain name for SSL certificate
# domain_name = "yourdomain.com"

# Optional: Custom S3 bucket name (leave empty to auto-generate)
# s3_bucket_name = ""
