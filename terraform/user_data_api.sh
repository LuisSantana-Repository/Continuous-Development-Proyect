#!/bin/bash
set -e

echo "Starting API server setup..."

# Update system
apt-get update
apt-get upgrade -y

# Install dependencies
apt-get install -y curl ca-certificates gnupg lsb-release jq awscli

# Install Docker (official method)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Enable Docker
systemctl enable docker
systemctl start docker

# Create app directory
mkdir -p /app
cd /app

# Get AWS region from EC2 metadata
AWS_REGION="${aws_region}"
PROJECT_NAME="${project_name}"

echo "Fetching environment variables from SSM Parameter Store..."

# Fetch all API parameters from SSM and create .env file
aws ssm get-parameters-by-path \
  --path "/$PROJECT_NAME/api/" \
  --with-decryption \
  --region $AWS_REGION \
  --query 'Parameters[*].[Name,Value]' \
  --output text | while read name value; do
    # Extract just the key name (remove path prefix)
    key=$(echo "$name" | sed "s|/$PROJECT_NAME/api/||")
    echo "$key=$value" >> .env
done

echo ".env file created with SSM parameters"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ecr_api_url} 2>/dev/null

# Pull the pre-built API image from ECR
echo "Pulling API image from ECR..."
docker pull ${ecr_api_url}:latest

# Stop and remove any existing container
docker stop api-server 2>/dev/null || true
docker rm api-server 2>/dev/null || true

# Run the application
echo "Starting API container..."
docker run --name api-server \
  --env-file .env \
  --restart=always \
  -d \
  -p 3000:3000 \
  ${ecr_api_url}:latest

echo "API server setup complete!"
echo "Container status:"
docker ps | grep api-server
