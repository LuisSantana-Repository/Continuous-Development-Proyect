#!/bin/bash
set -e

echo "Starting Web server setup..."

# Update system
apt-get update
apt-get upgrade -y

# Install dependencies
apt-get install -y curl ca-certificates gnupg lsb-release awscli

# Install Docker (official method)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Enable Docker
systemctl enable docker
systemctl start docker

# Create app directory
mkdir -p /app
cd /app

# Get AWS region from template variables
AWS_REGION="${aws_region}"

# Create .env file from Terraform variables (if any)
echo "Creating .env file..."
cat > .env << 'EOF'
%{ for key, value in env_vars ~}
${key}=${value}
%{ endfor ~}
EOF

echo ".env file created"

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
