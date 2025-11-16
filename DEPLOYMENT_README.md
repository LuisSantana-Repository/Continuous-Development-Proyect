# ECR Deployment Guide - Optimized Build Process

This project now uses **AWS ECR (Elastic Container Registry)** to pre-build Docker images, dramatically reducing deployment time and storage usage.

## 🎯 Benefits of This Approach

| Before (Building on EC2) | After (Using ECR) |
|-------------------------|-------------------|
| **Build Time**: 5-10 minutes per instance | **Deploy Time**: 30-60 seconds |
| **Storage Used**: ~7GB per instance | **Storage Used**: ~2-3GB per instance |
| **Auto-Scaling**: Slow (builds on each new instance) | **Auto-Scaling**: Fast (just pull pre-built image) |
| **Cost**: Higher (larger EBS volumes needed) | **Cost**: Lower (8GB EBS sufficient) |

## 🚀 Quick Start

### Step 1: Apply Terraform Infrastructure

This creates ECR repositories, SSM parameters, and updates EC2 configuration:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Step 2: Build and Push Docker Images

Run the build script to create and push Docker images to ECR:

```bash
# From project root
./scripts/build-and-push.sh all

# Or build individually:
./scripts/build-and-push.sh api
./scripts/build-and-push.sh web
```

**What this does:**
1. Builds multi-stage Docker images (much smaller!)
2. Logs into your ECR repositories
3. Tags images with `latest` and timestamp
4. Pushes to AWS ECR

### Step 3: Deploy EC2 Instances

Your EC2 instances will now:
1. Pull pre-built images from ECR (fast!)
2. Fetch environment variables from SSM Parameter Store
3. Start containers in ~30 seconds

```bash
# Trigger auto-scaling group refresh to deploy new instances
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name continuous-development-api-asg \
  --region us-east-1

aws autoscaling start-instance-refresh \
  --auto-scaling-group-name continuous-development-web-asg \
  --region us-east-1
```

## 📦 What Changed?

### 1. Multi-Stage Dockerfiles

**Before** (`api/Dockerfile`):
- Single stage
- Included all dependencies in final image
- ~500MB image size

**After** (`api/Dockerfile`):
- 3 stages: deps → builder → runner
- Only production dependencies in final image
- ~150MB image size (3x smaller!)
- Runs as non-root user (more secure)

**Before** (`stamin-up/Dockerfile`):
- Single stage
- Full Next.js build in final image
- ~800MB image size

**After** (`stamin-up/Dockerfile`):
- 3 stages: deps → builder → runner
- Uses Next.js standalone output
- ~200MB image size (4x smaller!)
- Runs as non-root user (more secure)

### 2. Environment Variable Management

**Before**: Variables passed via `terraform.tfvars` → user_data → `.env` file

**After**: Variables stored in **AWS SSM Parameter Store**
- Centralized configuration
- Encrypted sensitive values
- Easy to update without redeployment
- Fetch on-demand at runtime

See: [`ENV_SETUP.md`](./ENV_SETUP.md)

### 3. Updated user_data Scripts

**Before**:
```bash
git clone → npm install → docker build → docker run
```

**After**:
```bash
fetch SSM params → ECR login → docker pull → docker run
```

See:
- [`terraform/user_data_api.sh`](./terraform/user_data_api.sh)
- [`terraform/user_data_stamin.sh`](./terraform/user_data_stamin.sh)

## 🔄 Development Workflow

### Making Code Changes

1. **Make your changes** to `api/` or `stamin-up/`
2. **Build and push new images**:
   ```bash
   ./scripts/build-and-push.sh all
   ```
3. **Restart containers on EC2** (or let auto-scaling create new instances):
   ```bash
   # SSH into EC2
   ssh -i terraform/aws-ec2 ubuntu@<instance-ip>

   # Restart container to pull latest image
   sudo docker pull <ecr-url>:latest
   sudo docker restart api-server  # or web-server
   ```

### Updating Environment Variables

See [`ENV_SETUP.md`](./ENV_SETUP.md) for detailed instructions.

**Quick update**:
```bash
# Update a variable in SSM
aws ssm put-parameter \
  --name "/continuous-development/api/JWT_SECRET" \
  --type "SecureString" \
  --value "new-secret-value" \
  --overwrite \
  --region us-east-1

# Restart container to use new value
ssh -i terraform/aws-ec2 ubuntu@<instance-ip>
sudo docker restart api-server
```

## 📊 Monitoring

### View ECR Images

```bash
# List API images
aws ecr list-images \
  --repository-name continuous-development/api \
  --region us-east-1

# List Web images
aws ecr list-images \
  --repository-name continuous-development/web \
  --region us-east-1
```

### Check EC2 Deployment Status

```bash
# View Auto Scaling Group status
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names continuous-development-api-asg \
  --region us-east-1

# View running instances
aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=continuous-development" \
  --region us-east-1 \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
  --output table
```

### SSH into Instance and Check Logs

```bash
# SSH into instance
ssh -i terraform/aws-ec2 ubuntu@<instance-ip>

# View user_data execution logs
sudo cat /var/log/cloud-init-output.log

# View Docker container logs
sudo docker logs api-server
# or
sudo docker logs web-server

# Check running containers
sudo docker ps
```

## 🔧 Troubleshooting

### Build fails locally

**Problem**: `docker build` fails

**Solution**:
1. Check Docker is running: `docker info`
2. Check you're in the correct directory
3. Review error messages in build output

### Can't push to ECR

**Problem**: `denied: User is not authorized to perform: ecr:BatchCheckLayerAvailability`

**Solution**:
1. Check AWS credentials: `aws sts get-caller-identity`
2. Ensure ECR repositories exist: `terraform apply`
3. Re-login to ECR: See [`scripts/build-and-push.sh`](./scripts/build-and-push.sh)

### EC2 instance can't pull from ECR

**Problem**: Instance fails to pull image

**Solution**:
1. Check IAM role has ECR permissions (already configured in `terraform/modules/iam/main.tf`)
2. SSH into instance and check: `sudo cat /var/log/cloud-init-output.log`
3. Manually test ECR access:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   ```

### Application not starting

**Problem**: Container starts but app doesn't work

**Solution**:
1. Check environment variables: `cat /app/.env`
2. Check Docker logs: `sudo docker logs api-server`
3. Verify SSM parameters exist:
   ```bash
   aws ssm get-parameters-by-path --path "/continuous-development/api/" --region us-east-1
   ```

## 💰 Cost Optimization

### ECR Storage Costs

- **Cost**: $0.10 per GB-month
- **Lifecycle Policy**: Automatically deletes old images (keeps last 5)
- **Typical cost**: $0.05-0.20/month

### EBS Volume Optimization

You can now use smaller volumes:
- **Before**: 20GB recommended
- **After**: 8GB sufficient
- **Savings**: ~$0.80/month per instance

## 🔐 Security Improvements

1. ✅ **Multi-stage builds** reduce attack surface
2. ✅ **Non-root user** in containers
3. ✅ **SSM SecureString** encrypts sensitive values
4. ✅ **IAM roles** instead of hardcoded credentials
5. ✅ **Health checks** in Dockerfiles
6. ✅ **No secrets in Git** - all in SSM

## 📚 Related Documentation

- [Environment Variables Setup](./ENV_SETUP.md)
- [Build Script](./scripts/build-and-push.sh)
- [API Dockerfile](./api/Dockerfile)
- [Web Dockerfile](./stamin-up/Dockerfile)
- [Terraform ECR Module](./terraform/modules/ecr/main.tf)
- [Terraform SSM Module](./terraform/modules/ssm/main.tf)

## 🆘 Need Help?

1. Check logs: `sudo cat /var/log/cloud-init-output.log`
2. Review AWS Console: ECR, EC2, SSM Parameter Store
3. Test locally: `docker build -t test .`
4. Contact your team or check AWS documentation

---

**Happy Deploying! 🚀**
