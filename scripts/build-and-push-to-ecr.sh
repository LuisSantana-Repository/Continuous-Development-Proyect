#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="${PROJECT_NAME:-stamin-up}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Docker Image Build and Push to ECR${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "AWS Region: $AWS_REGION"
echo "Project: $PROJECT_NAME"
echo "Image Tag: $IMAGE_TAG"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# ECR repository URLs
WEB_REPO_NAME="${PROJECT_NAME}-web"
API_REPO_NAME="${PROJECT_NAME}-api"
WEB_ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${WEB_REPO_NAME}"
API_ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${API_REPO_NAME}"

echo ""
echo "Web ECR: $WEB_ECR_URL"
echo "API ECR: $API_ECR_URL"

# Authenticate Docker to ECR
echo ""
echo -e "${YELLOW}Authenticating Docker to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to authenticate to ECR${NC}"
    exit 1
fi

# Build and push WEB image
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Building WEB Docker Image${NC}"
echo -e "${GREEN}========================================${NC}"
cd stamin-up

echo "Building with production Dockerfile..."
docker build -f Dockerfile.prod -t ${WEB_REPO_NAME}:${IMAGE_TAG} .

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build WEB image${NC}"
    exit 1
fi

echo ""
echo "Tagging WEB image for ECR..."
docker tag ${WEB_REPO_NAME}:${IMAGE_TAG} ${WEB_ECR_URL}:${IMAGE_TAG}
docker tag ${WEB_REPO_NAME}:${IMAGE_TAG} ${WEB_ECR_URL}:$(date +%Y%m%d-%H%M%S)

echo ""
echo -e "${YELLOW}Pushing WEB image to ECR...${NC}"
docker push ${WEB_ECR_URL}:${IMAGE_TAG}
docker push ${WEB_ECR_URL}:$(date +%Y%m%d-%H%M%S)

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push WEB image${NC}"
    exit 1
fi

echo -e "${GREEN}✓ WEB image pushed successfully${NC}"

# Build and push API image
cd ..
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Building API Docker Image${NC}"
echo -e "${GREEN}========================================${NC}"
cd api

echo "Building with production Dockerfile..."
docker build -f Dockerfile.prod -t ${API_REPO_NAME}:${IMAGE_TAG} .

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build API image${NC}"
    exit 1
fi

echo ""
echo "Tagging API image for ECR..."
docker tag ${API_REPO_NAME}:${IMAGE_TAG} ${API_ECR_URL}:${IMAGE_TAG}
docker tag ${API_REPO_NAME}:${IMAGE_TAG} ${API_ECR_URL}:$(date +%Y%m%d-%H%M%S)

echo ""
echo -e "${YELLOW}Pushing API image to ECR...${NC}"
docker push ${API_ECR_URL}:${IMAGE_TAG}
docker push ${API_ECR_URL}:$(date +%Y%m%d-%H%M%S)

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push API image${NC}"
    exit 1
fi

echo -e "${GREEN}✓ API image pushed successfully${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build and Push Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Images available at:"
echo "  WEB: ${WEB_ECR_URL}:${IMAGE_TAG}"
echo "  API: ${API_ECR_URL}:${IMAGE_TAG}"
echo ""
echo "To use these in Terraform, update your terraform.tfvars:"
echo "  web_docker_image = \"${WEB_ECR_URL}:${IMAGE_TAG}\""
echo "  api_docker_image = \"${API_ECR_URL}:${IMAGE_TAG}\""
echo ""
