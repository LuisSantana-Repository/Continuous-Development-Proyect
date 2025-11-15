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
  ssh_public_key_path   = "${path.module}/aws-ec2.pub"
  alb_dns_name          = module.lb.alb_dns_name
  api_env_vars          = var.api_env_vars
  stamin_env_vars       = var.stamin_env_vars
  web_target_group_arn  = module.lb.web_target_group_arn
  api_target_group_arn  = module.lb.api_target_group_arn
}
