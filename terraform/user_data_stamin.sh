#!/bin/bash
set -e

echo "Starting Web server setup..."

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

# Fetch all Web parameters from SSM and create .env file
aws ssm get-parameters-by-path \
  --path "/$PROJECT_NAME/web/" \
  --with-decryption \
  --region $AWS_REGION \
  --query 'Parameters[*].[Name,Value]' \
  --output text | while read name value; do
    # Extract just the key name (remove path prefix)
    key=$(echo "$name" | sed "s|/$PROJECT_NAME/web/||")
    echo "$key=$value" >> .env
done

echo ".env file created with SSM parameters"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ecr_web_url} 2>/dev/null

# Pull the pre-built Web image from ECR
echo "Pulling Web image from ECR..."
docker pull ${ecr_web_url}:latest

# Stop and remove any existing container
docker stop web-server 2>/dev/null || true
docker rm web-server 2>/dev/null || true

# Run the application
echo "Starting Web container..."
docker run --name web-server \
  --env-file .env \
  --restart=always \
  -d \
  -p 3001:3001 \
  ${ecr_web_url}:latest

echo "Web server setup complete!"
echo "Container status:"
docker ps | grep web-server
