# Null resource to build Lambda package
resource "null_resource" "build_lambda" {
  triggers = {
    # Rebuild if Lambda code changes
    lambda_code   = filemd5("${path.module}/lambda/index.py")
    primary_sql   = filemd5("${var.primary_sql_file}")
    secondary_sql = var.secondary_sql_file != "" ? filemd5(var.secondary_sql_file) : ""
  }

  provisioner "local-exec" {
    working_dir = path.module
    interpreter = ["python", "-c"]
    command     = <<-EOT
import os
import shutil
import subprocess
import sys

# Paths
lambda_dir = 'lambda'
package_dir = 'lambda_package'
zip_file = 'lambda_function.zip'

# Clean up previous builds
if os.path.exists(package_dir):
    shutil.rmtree(package_dir)
if os.path.exists(zip_file):
    os.remove(zip_file)

# Create package directory
os.makedirs(package_dir, exist_ok=True)

# Install Python dependencies
try:
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-r',
                   os.path.join(lambda_dir, 'requirements.txt'),
                   '-t', package_dir, '--quiet'], check=True)
except subprocess.CalledProcessError:
    print("Warning: pip install failed, continuing anyway...")

# Copy Lambda function
shutil.copy2(os.path.join(lambda_dir, 'index.py'), package_dir)

# Copy SQL initialization files
primary_sql = r'${replace(var.primary_sql_file, "\\", "\\\\")}'
shutil.copy2(primary_sql, os.path.join(package_dir, 'init-db-primary.sql'))

# Copy secondary SQL file if provided
secondary_sql = r'${replace(var.secondary_sql_file, "\\", "\\\\")}'
if secondary_sql:
    shutil.copy2(secondary_sql, os.path.join(package_dir, 'init-db-secondary.sql'))

print("Lambda package built successfully")
    EOT
  }
}

# Create ZIP after build
data "archive_file" "lambda_package" {
  depends_on  = [null_resource.build_lambda]
  type        = "zip"
  source_dir  = "${path.module}/lambda_package"
  output_path = "${path.module}/lambda_function.zip"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-db-init-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "${var.project_name}-db-init-lambda-role"
    Project = var.project_name
  }
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach VPC execution policy (needed to access RDS in VPC)
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Security Group for Lambda
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-db-init-lambda-sg"
  description = "Security group for database initialization Lambda"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-db-init-lambda-sg"
    Project = var.project_name
  }
}

# Add ingress rule to RDS security group to allow Lambda access
resource "aws_security_group_rule" "rds_from_lambda" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda_sg.id
  security_group_id        = var.rds_security_group_id
  description              = "Allow Lambda to access RDS for initialization"
}

# Lambda Function
resource "aws_lambda_function" "db_init" {
  depends_on = [
    data.archive_file.lambda_package,
    null_resource.build_lambda
  ]

  filename         = data.archive_file.lambda_package.output_path
  function_name    = "${var.project_name}-db-init"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime         = "python3.11"
  timeout         = 300 # 5 minutes

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      PRIMARY_DB_HOST   = var.primary_db_host
      PRIMARY_DB_NAME   = var.primary_db_name
      SECONDARY_DB_HOST = var.secondary_db_host
      SECONDARY_DB_NAME = var.secondary_db_name
      DB_USERNAME       = var.db_username
      DB_PASSWORD       = var.db_password
    }
  }

  tags = {
    Name    = "${var.project_name}-db-init"
    Project = var.project_name
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.db_init.function_name}"
  retention_in_days = 7

  tags = {
    Name    = "${var.project_name}-db-init-logs"
    Project = var.project_name
  }
}

# Invoke Lambda function to initialize databases
resource "aws_lambda_invocation" "db_init" {
  count = var.auto_invoke ? 1 : 0

  depends_on = [
    aws_lambda_function.db_init,
    aws_security_group_rule.rds_from_lambda
  ]

  function_name = aws_lambda_function.db_init.function_name

  input = jsonencode({
    action = "initialize"
  })

  # Trigger re-invocation if SQL files change
  triggers = {
    primary_sql   = filemd5(var.primary_sql_file)
    secondary_sql = var.secondary_sql_file != "" ? filemd5(var.secondary_sql_file) : ""
    rerun         = var.force_reinvoke ? timestamp() : "initial"
  }
}
