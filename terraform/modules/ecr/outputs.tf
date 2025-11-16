output "web_repository_url" {
  description = "URL of the Web ECR repository"
  value       = aws_ecr_repository.web.repository_url
}

output "web_repository_name" {
  description = "Name of the Web ECR repository"
  value       = aws_ecr_repository.web.name
}

output "web_repository_arn" {
  description = "ARN of the Web ECR repository"
  value       = aws_ecr_repository.web.arn
}
