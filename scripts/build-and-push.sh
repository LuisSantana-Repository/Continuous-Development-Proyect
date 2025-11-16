#!/bin/bash

# Build and Push Docker Images to ECR
# This script builds the Docker images locally and pushes them to AWS ECR
# Usage: ./scripts/build-and-push.sh [api|web|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="${PROJECT_NAME:-continuous-development}"
SERVICE="${1:-all}"

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Docker Build and Push to ECR${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Get AWS Account ID
echo -e "${YELLOW}Getting AWS Account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Could not get AWS Account ID. Check your AWS credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}AWS Account ID: $AWS_ACCOUNT_ID${NC}"
echo -e "${GREEN}AWS Region: $AWS_REGION${NC}"
echo ""

# Login to ECR
echo -e "${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to login to ECR${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully logged into ECR${NC}"
echo ""

# Function to build and push API
build_api() {
    echo -e "${YELLOW}==================================${NC}"
    echo -e "${YELLOW}Building API Image${NC}"
    echo -e "${YELLOW}==================================${NC}"

    cd "$(dirname "$0")/../api" || exit 1

    ECR_REPO_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/api"

    echo -e "${YELLOW}Building Docker image for API...${NC}"
    docker build -t $PROJECT_NAME/api:latest .

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Docker build failed for API${NC}"
        exit 1
    fi

    echo -e "${GREEN}API image built successfully${NC}"

    # Tag for ECR
    echo -e "${YELLOW}Tagging image for ECR...${NC}"
    docker tag $PROJECT_NAME/api:latest $ECR_REPO_URL:latest
    docker tag $PROJECT_NAME/api:latest $ECR_REPO_URL:$(date +%Y%m%d-%H%M%S)

    # Push to ECR
    echo -e "${YELLOW}Pushing to ECR...${NC}"
    docker push $ECR_REPO_URL:latest
    docker push $ECR_REPO_URL:$(date +%Y%m%d-%H%M%S)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ API image pushed successfully to ECR${NC}"
        echo -e "${GREEN}  Repository: $ECR_REPO_URL${NC}"
    else
        echo -e "${RED}Error: Failed to push API image${NC}"
        exit 1
    fi

    cd - > /dev/null
    echo ""
}

# Function to build and push Web
build_web() {
    echo -e "${YELLOW}==================================${NC}"
    echo -e "${YELLOW}Building Web Image${NC}"
    echo -e "${YELLOW}==================================${NC}"

    cd "$(dirname "$0")/../stamin-up" || exit 1

    ECR_REPO_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/web"

    echo -e "${YELLOW}Building Docker image for Web (Next.js)...${NC}"
    docker build -t $PROJECT_NAME/web:latest .

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Docker build failed for Web${NC}"
        exit 1
    fi

    echo -e "${GREEN}Web image built successfully${NC}"

    # Tag for ECR
    echo -e "${YELLOW}Tagging image for ECR...${NC}"
    docker tag $PROJECT_NAME/web:latest $ECR_REPO_URL:latest
    docker tag $PROJECT_NAME/web:latest $ECR_REPO_URL:$(date +%Y%m%d-%H%M%S)

    # Push to ECR
    echo -e "${YELLOW}Pushing to ECR...${NC}"
    docker push $ECR_REPO_URL:latest
    docker push $ECR_REPO_URL:$(date +%Y%m%d-%H%M%S)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Web image pushed successfully to ECR${NC}"
        echo -e "${GREEN}  Repository: $ECR_REPO_URL${NC}"
    else
        echo -e "${RED}Error: Failed to push Web image${NC}"
        exit 1
    fi

    cd - > /dev/null
    echo ""
}

# Build based on argument
case "$SERVICE" in
    api)
        build_api
        ;;
    web)
        build_web
        ;;
    all)
        build_api
        build_web
        ;;
    *)
        echo -e "${RED}Error: Invalid service '$SERVICE'${NC}"
        echo "Usage: $0 [api|web|all]"
        exit 1
        ;;
esac

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Build and Push Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Apply Terraform changes: cd terraform && terraform apply"
echo "2. SSH into EC2 instances will automatically pull these images"
echo "3. Monitor deployment: aws ec2 describe-instances --region $AWS_REGION"
echo ""
