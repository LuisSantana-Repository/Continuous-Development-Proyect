# ECR Repository for Web (Next.js) only
# API continues using traditional build process on EC2

# Web ECR Repository
resource "aws_ecr_repository" "web" {
  name                 = "${var.project_name}/web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.project_name}-web-ecr"
    Project     = var.project_name
    Environment = "production"
  }
}

# Lifecycle policy to keep only recent images
resource "aws_ecr_lifecycle_policy" "web_policy" {
  repository = aws_ecr_repository.web.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}
