# Terraform Configuration Changes

## Summary of Changes

All Terraform files have been updated to meet your requirements:

### 1. **Region Configuration** ✅
- **Fixed**: Changed from `mx-central-1` (doesn't exist) to `us-east-1`
- **Availability Zones**: Using 2 AZs (`us-east-1a`, `us-east-1b`) for RDS multi-AZ support

### 2. **Instance Types** ✅
- **Updated**: Changed from `t3.micro` to `t3.small` for both API and Web servers
- Better performance with 2 vCPUs and 2GB RAM per instance

### 3. **Auto Scaling** ✅
- **Max Instances**: Limited to 3 instances maximum (was 4)
- **Min Instances**: 1 instance (cost-effective)
- **Scaling Trigger**: CPU-based autoscaling configured
  - Target CPU: 70-80% utilization
  - Scales up when CPU is high, scales down when CPU is low

### 4. **Databases** ✅
- **Primary RDS**: MySQL 8.0 (db.t3.micro) - `my_sql_rds_hot`
- **Secondary RDS**: MySQL 8.0 (db.t3.micro) - `analytics_db`
- **Multi-AZ**: Configurable (currently single-AZ for cost savings)

### 5. **DynamoDB Tables** ✅
Three DynamoDB tables configured:
- `sessions` - User session data with TTL
- `chats` - Chat conversations with GSI for user/provider lookup
- `messages` - Chat messages with timestamp range key

### 6. **S3 Bucket** ✅
- Configured with encryption (AES256)
- Public access blocked
- CORS enabled for application use
- Versioning disabled (cost savings)

### 7. **Cost Optimizations** 💰
- NAT Gateway: Disabled (saves ~$48/month)
- VPC Flow Logs: Disabled (saves CloudWatch costs)
- S3 Versioning: Disabled (saves storage costs)
- DynamoDB PITR: Disabled (saves backup costs)
- Single AZ for RDS: Enabled (development mode)

## Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet Gateway                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                Application Load Balancer                     │
│                   (HTTP Port 80)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                              │
┌───────▼────────┐           ┌────────▼───────┐
│  Web Target    │           │  API Target    │
│  Group (3001)  │           │  Group (3000)  │
└───────┬────────┘           └────────┬───────┘
        │                              │
┌───────▼────────┐           ┌────────▼───────┐
│  Web ASG       │           │  API ASG       │
│  (1-3 t3.small)│           │  (1-3 t3.small)│
│  CPU-based     │           │  CPU-based     │
└───────┬────────┘           └────────┬───────┘
        │                              │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                              │
┌───────▼────────┐           ┌────────▼────────┐
│  RDS Primary   │           │  RDS Secondary  │
│  (db.t3.micro) │           │  (db.t3.micro)  │
└────────────────┘           └─────────────────┘

┌────────────────┐           ┌─────────────────┐
│  S3 Bucket     │           │  DynamoDB       │
│  (Encrypted)   │           │  (3 Tables)     │
└────────────────┘           └─────────────────┘
```

## Files Modified

1. **terraform/main.tf** - Created
   - Provider configuration
   - AWS region settings
   - AMI data source for auto-detection

2. **terraform/variables.tf** - Updated
   - Fixed region default to `us-east-1`
   - Updated instance types to `t3.small`
   - Set max autoscaling to 3 instances
   - Enabled secondary database by default
   - Updated to 2 availability zones

3. **terraform/terraform.tfvars** - Updated
   - Corrected AWS region
   - Set proper availability zones
   - Configured t3.small instances
   - Enabled 2 databases
   - Cost optimization flags

4. **terraform/ec2.tf** - Updated
   - Auto-detect latest Amazon Linux 2023 AMI
   - CPU-based autoscaling configuration verified

## Next Steps

### 1. Initialize Terraform
```bash
cd terraform
terraform init
```

### 2. Validate Configuration
```bash
terraform validate
```

### 3. Plan Infrastructure
```bash
terraform plan
```

### 4. Apply Configuration (when ready)
```bash
terraform apply
```

### 5. Access Your Application
After deployment, you'll receive:
- ALB DNS name for accessing your application
- RDS endpoints for database connections
- S3 bucket name
- DynamoDB table names

## Important Notes

⚠️ **Before Running Terraform:**

1. **SSH Key**: Ensure `stamin-up-key.pem` exists in your AWS account (us-east-1 region)
   ```bash
   aws ec2 create-key-pair --key-name stamin-up-key --query 'KeyMaterial' --output text > stamin-up-key.pem
   chmod 400 stamin-up-key.pem
   ```

2. **AWS Credentials**: Configure AWS CLI with proper credentials
   ```bash
   aws configure
   ```

3. **Docker Compose**: For local development, use the `docker-compose.yml` in the root directory

4. **Sensitive Data**: Never commit `terraform.tfvars` with real passwords to git

## Cost Estimate (Monthly)

**Development Configuration:**
- EC2 (2x t3.small): ~$30/month (if running 24/7)
- RDS (2x db.t3.micro): ~$30/month
- ALB: ~$20/month
- S3: ~$1/month (minimal usage)
- DynamoDB: Free tier / pay-per-request
- **Total**: ~$81/month

**Note**: Costs can be reduced by:
- Stopping instances when not in use
- Using single RDS instance
- Disabling secondary database

## Autoscaling Behavior

The infrastructure will automatically scale based on CPU usage:
- **Scale Up**: When average CPU > 70-80% for 2 consecutive periods (10 minutes)
- **Scale Down**: When average CPU drops below target
- **Max Capacity**: 3 instances per service (API and Web)
- **Response Time**: ~5 minutes to launch new instances

## Security Features

✅ Encryption at rest (RDS, S3, DynamoDB)
✅ Security groups with least privilege
✅ IMDSv2 enabled for EC2
✅ IAM roles with specific permissions
✅ S3 public access blocked
✅ VPC with public/private subnet separation

## Monitoring

CloudWatch metrics enabled for:
- EC2 CPU, Memory, Disk
- RDS Connections, CPU, Storage
- ALB Request Count, Target Health
- DynamoDB Read/Write Capacity
- Auto Scaling Group metrics
