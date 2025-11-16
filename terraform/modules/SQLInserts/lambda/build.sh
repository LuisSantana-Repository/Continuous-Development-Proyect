#!/bin/bash
set -e

echo "Building Lambda deployment package..."

# Clean up previous builds
rm -rf package
rm -f lambda_function.zip

# Create package directory
mkdir -p package

# Install Python dependencies
pip install -r requirements.txt -t package/ --quiet

# Copy Lambda function
cp index.py package/

# Copy SQL initialization files from project root
cp ../../../../init-db-primary.sql package/
cp ../../../../init-db-secondary.sql package/

# Create ZIP file
cd package
zip -r ../lambda_function.zip . -q
cd ..

# Cleanup
rm -rf package

echo "Lambda package created: lambda_function.zip"
ls -lh lambda_function.zip
