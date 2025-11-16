terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Networking Module - VPC and AMI data sources
module "networking" {
  source = "./modules/networking"
}

# Security Module - Security Groups
module "security" {
  source       = "./modules/security"
  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
}

# RDS Module - MySQL Databases
module "rds" {
  source                     = "./modules/rds"
  project_name               = var.project_name
  vpc_id                     = module.networking.vpc_id
  subnet_ids                 = module.networking.subnet_ids
  app_sg_id                  = module.security.app_sg_id
  db_instance_class          = var.db_instance_class
  db_username                = var.db_username
  db_password                = var.db_password
  enable_multi_az            = var.enable_multi_az
  enable_secondary_db        = var.enable_secondary_db
  backup_retention_period    = var.backup_retention_period
  enable_deletion_protection = var.enable_deletion_protection
}


# IAM Module - EC2 Roles (create FIRST, before S3 and DynamoDB)
module "iam" {
  source         = "./modules/iam"
  project_name   = var.project_name
  s3_bucket_name = "${var.project_name}-bucket-${var.s3_environment}"
}

# ECR Module - Container Registry for Docker Images
module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
}

# S3 Module - Complete S3 Configuration
module "s3" {
  source                    = "./modules/s3"
  project_name              = var.project_name
  environment               = var.s3_environment
  enable_versioning         = var.s3_enable_versioning
  enable_logging            = var.s3_enable_logging
  enable_lifecycle_rules    = var.s3_enable_lifecycle_rules
  enable_notifications      = var.s3_enable_notifications
  transition_to_ia_days     = var.s3_transition_to_ia_days
  transition_to_glacier_days = var.s3_transition_to_glacier_days
  expiration_days           = var.s3_expiration_days
  cors_allowed_origins      = var.s3_cors_allowed_origins
  ec2_role_arn              = module.iam.ec2_role_arn

  depends_on = [module.iam]
}

# DynamoDB Module - NoSQL Tables
module "dynamodb" {
  source                        = "./modules/dynamodb"
  project_name                  = var.project_name
  environment                   = var.dynamodb_environment
  ec2_role_name                 = module.iam.ec2_role_name
  enable_ttl                    = var.dynamodb_enable_ttl
  enable_point_in_time_recovery = var.dynamodb_enable_pitr
  enable_streams                = var.dynamodb_enable_streams

  depends_on = [module.iam]
}

# Load Balancer Module - ALB and Target Groups
module "lb" {
  source       = "./modules/lb"
  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  subnet_ids   = module.networking.subnet_ids
  alb_sg_id    = module.security.alb_sg_id
}

# EC2 Module - Launch Templates and Instances
module "ec2" {
  source                = "./modules/ec2"
  project_name          = var.project_name
  ami_id                = module.networking.ubuntu_ami_id
  instance_type         = var.instance_type
  app_sg_id             = module.security.app_sg_id
  subnet_ids            = module.networking.subnet_ids
  ssh_public_key_path   = "${path.module}/aws-ec2.pub"
  alb_dns_name          = module.lb.alb_dns_name
  iam_instance_profile_name = module.iam.instance_profile_name

  # Auto Scaling configuration
  api_min_size          = var.api_min_size
  api_max_size          = var.api_max_size
  api_desired_capacity  = var.api_desired_capacity
  web_min_size          = var.web_min_size
  web_max_size          = var.web_max_size
  web_desired_capacity  = var.web_desired_capacity
  lb_public_dns         = module.lb.alb_public_dns
  
  # Environment variables with RDS connection info
  api_env_vars          = merge(
    var.api_env_vars,
    {
      AWS_REGION         = var.aws_region
      DB_PRIMARY_HOST     = module.rds.primary_db_address
      DB_PRIMARY_PORT     = tostring(module.rds.primary_db_port)
      DB_PRIMARY_NAME     = module.rds.primary_db_name
      DB_PRIMARY_USER     = var.db_username
      DB_PRIMARY_PASSWORD = var.db_password
      DB_SECONDARY_HOST     = var.enable_secondary_db ? module.rds.secondary_db_address : ""
      DB_SECONDARY_PORT     = var.enable_secondary_db ? tostring(module.rds.secondary_db_port) : "3306"
      DB_SECONDARY_NAME     = var.enable_secondary_db ? module.rds.secondary_db_name : ""
      DB_SECONDARY_USER     = var.db_username
      DB_SECONDARY_PASSWORD = var.db_password
      # S3 configuration
      S3_BUCKET_NAME        = module.s3.bucket_id
      S3_REGION             = var.aws_region
      # DynamoDB configuration
      DYNAMODB_SESSIONS_TABLE = module.dynamodb.sessions_table_name
      DYNAMODB_CHATS_TABLE    = module.dynamodb.chats_table_name
      DYNAMODB_MESSAGES_TABLE = module.dynamodb.messages_table_name
      DYNAMODB_REGION         = var.aws_region
      # Frontend URL for CORS
      FRONTEND_URL            = "http://${module.lb.alb_public_dns}"
    }
  )
  stamin_env_vars       = var.stamin_env_vars

  # Target groups
  web_target_group_arn  = module.lb.web_target_group_arn
  api_target_group_arn  = module.lb.api_target_group_arn

  # Docker images from ECR
  web_docker_image = "${module.ecr.web_repository_url}:${var.docker_image_tag}"
  api_docker_image = "${module.ecr.api_repository_url}:${var.docker_image_tag}"
  aws_region       = var.aws_region

  depends_on = [module.rds, module.s3, module.iam, module.dynamodb, module.ecr]
}
