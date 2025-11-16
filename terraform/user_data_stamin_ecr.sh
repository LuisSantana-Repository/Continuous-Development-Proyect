#!/bin/bash
set -e

# Log everything to a file for debugging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user-data script at $(date)"

# Update system
apt-get update
apt-get upgrade -y

# Install AWS CLI and Docker
apt-get install -y awscli docker.io

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Get AWS region and account ID from instance metadata
AWS_REGION="${aws_region}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "AWS Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT_ID"

# Authenticate Docker to ECR
echo "Authenticating to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Pull the web Docker image
echo "Pulling Docker image: ${docker_image}"
docker pull ${docker_image}

# Create app directory for environment file
mkdir -p /app

# Create environment file
echo "Creating .env file..."
cat > /app/.env << 'EOF'
%{ for key, value in env_vars ~}
${key}=${value}
%{ endfor ~}
EOF

# Run the container
echo "Starting web application container..."
docker run \
  --name web-app \
  --env-file /app/.env \
  --restart=always \
  -d \
  -p 3001:3001 \
  ${docker_image}

# Check if container is running
sleep 5
if docker ps | grep -q web-app; then
  echo "Web application started successfully!"
  docker logs web-app
else
  echo "ERROR: Web application failed to start"
  docker logs web-app
  exit 1
fi

echo "User-data script completed at $(date)"
