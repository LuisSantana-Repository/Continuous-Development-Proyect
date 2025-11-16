# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_s3_access" {
  name = "${var.project_name}-ec2-s3-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "${var.project_name}-ec2-s3-access-role"
    Project = var.project_name
  }
}

# IAM Policy for S3 access - using wildcard for bucket ARN
resource "aws_iam_role_policy" "s3_access" {
  name = "${var.project_name}-s3-access-policy"
  role = aws_iam_role.ec2_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs (for EC2 monitoring)
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.project_name}-cloudwatch-logs-policy"
  role = aws_iam_role.ec2_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IAM Policy for ECR access (pull Docker images)
resource "aws_iam_role_policy" "ecr_access" {
  name = "${var.project_name}-ecr-access-policy"
  role = aws_iam_role.ec2_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:DescribeRepositories",
          "ecr:ListImages"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for SSM Parameter Store (environment variables)
resource "aws_iam_role_policy" "ssm_access" {
  name = "${var.project_name}-ssm-access-policy"
  role = aws_iam_role.ec2_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/${var.project_name}/*"
      }
    ]
  })
}

# Instance Profile (required to attach IAM role to EC2)
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_s3_access.name

  tags = {
    Name    = "${var.project_name}-ec2-instance-profile"
    Project = var.project_name
  }
}
