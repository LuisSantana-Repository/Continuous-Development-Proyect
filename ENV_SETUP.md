# Environment Variables Setup Guide

This guide explains how to configure environment variables for your application using AWS Systems Manager (SSM) Parameter Store.

## Overview

Your application now uses **AWS SSM Parameter Store** to manage environment variables securely. This means:

1. ✅ Environment variables are stored securely in AWS
2. ✅ Sensitive data (passwords, secrets) is encrypted
3. ✅ EC2 instances fetch variables automatically on startup
4. ✅ No `.env` files committed to Git
5. ✅ Easy to update without redeploying code

## How It Works

```
Terraform Apply
     ↓
Creates SSM Parameters (from terraform.tfvars)
     ↓
EC2 Instance Starts
     ↓
user_data script fetches parameters from SSM
     ↓
Creates .env file on instance
     ↓
Docker container runs with environment variables
```

## Setting Up Environment Variables

### Method 1: Using Terraform Variables (Recommended)

1. **Edit `terraform/terraform.tfvars`** (create if doesn't exist):

```hcl
# Project configuration
project_name = "continuous-development"
aws_region   = "us-east-1"

# API Environment Variables
api_env_vars = {
  NODE_ENV    = "production"
  PORT        = "3000"
  JWT_SECRET  = "your-super-secret-jwt-key-change-this"

  # These will be merged with RDS/S3/DynamoDB values from Terraform
  # DB_PRIMARY_HOST, DB_PRIMARY_PORT, etc. are auto-populated
}

# Web Environment Variables
stamin_env_vars = {
  NODE_ENV              = "production"
  NEXT_PUBLIC_API_URL   = "http://your-alb-dns.us-east-1.elb.amazonaws.com/api"
  # Add any other Next.js public variables
}
```

2. **Apply Terraform**:

```bash
cd terraform
terraform apply
```

This will create/update SSM parameters automatically.

### Method 2: Using AWS CLI (For Updating Individual Variables)

Update a single parameter without Terraform:

```bash
# Set a non-sensitive value
aws ssm put-parameter \
  --name "/continuous-development/api/NODE_ENV" \
  --type "String" \
  --value "production" \
  --overwrite \
  --region us-east-1

# Set a sensitive value (encrypted)
aws ssm put-parameter \
  --name "/continuous-development/api/JWT_SECRET" \
  --type "SecureString" \
  --value "your-secret-value" \
  --overwrite \
  --region us-east-1
```

### Method 3: Using AWS Console

1. Go to **AWS Systems Manager** → **Parameter Store**
2. Click **Create parameter**
3. Name: `/continuous-development/api/YOUR_VAR_NAME`
4. Type: `String` or `SecureString` (for sensitive data)
5. Value: Your environment variable value
6. Click **Create parameter**

## Environment Variable Naming Convention

Parameters must follow this path structure:

- **API variables**: `/continuous-development/api/VARIABLE_NAME`
- **Web variables**: `/continuous-development/web/VARIABLE_NAME`

Examples:
- `/continuous-development/api/JWT_SECRET`
- `/continuous-development/api/PORT`
- `/continuous-development/web/NEXT_PUBLIC_API_URL`

## Automatically Populated Variables

These variables are **automatically set by Terraform** and don't need manual configuration:

### API Service:
- `AWS_REGION`
- `DB_PRIMARY_HOST`
- `DB_PRIMARY_PORT`
- `DB_PRIMARY_NAME`
- `DB_PRIMARY_USER`
- `DB_PRIMARY_PASSWORD`
- `S3_BUCKET_NAME`
- `S3_REGION`
- `DYNAMODB_SESSIONS_TABLE`
- `DYNAMODB_CHATS_TABLE`
- `DYNAMODB_MESSAGES_TABLE`
- `DYNAMODB_REGION`

## Viewing Current Parameters

List all API parameters:
```bash
aws ssm get-parameters-by-path \
  --path "/continuous-development/api/" \
  --region us-east-1
```

List all Web parameters:
```bash
aws ssm get-parameters-by-path \
  --path "/continuous-development/web/" \
  --region us-east-1
```

Get a specific parameter value:
```bash
aws ssm get-parameter \
  --name "/continuous-development/api/JWT_SECRET" \
  --with-decryption \
  --region us-east-1 \
  --query "Parameter.Value" \
  --output text
```

## Updating Variables After Deployment

If you update SSM parameters after EC2 instances are running, you need to:

**Option 1: Restart the Docker container**
```bash
# SSH into EC2 instance
ssh -i aws-ec2 ubuntu@<instance-ip>

# For API server
sudo docker restart api-server

# For Web server
sudo docker restart web-server
```

**Option 2: Trigger Auto Scaling Group refresh**
```bash
# This will create new instances with updated values
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name continuous-development-api-asg \
  --region us-east-1
```

## Security Best Practices

1. ✅ **Use `SecureString` type** for sensitive data (passwords, API keys, secrets)
2. ✅ **Never commit** `.env` files or `terraform.tfvars` to Git
3. ✅ **Add to `.gitignore`**:
   ```
   terraform.tfvars
   .env
   .env.*
   ```
4. ✅ **Rotate secrets regularly** using AWS Secrets Manager rotation
5. ✅ **Use IAM roles** instead of access keys when possible

## Troubleshooting

### EC2 instance can't fetch parameters

Check IAM permissions:
```bash
# The EC2 instance role should have this policy attached
# (already configured in terraform/modules/iam/main.tf)
aws iam get-role-policy \
  --role-name continuous-development-ec2-s3-access-role \
  --policy-name continuous-development-ssm-access-policy
```

### View user_data logs

SSH into instance and check:
```bash
sudo cat /var/log/cloud-init-output.log
```

### Verify .env file was created

```bash
cat /app/.env
```

## Example Configuration Files

See the following files for examples:
- `api/.env.example` - API environment variables template
- `stamin-up/.env.example` - Web environment variables template
- `terraform/terraform.tfvars.example` - Terraform variables example

## Need Help?

- AWS SSM Documentation: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
- AWS CLI SSM Commands: https://docs.aws.amazon.com/cli/latest/reference/ssm/
