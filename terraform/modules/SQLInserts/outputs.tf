output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.db_init.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.db_init.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_security_group_id" {
  description = "Security group ID of the Lambda function"
  value       = aws_security_group.lambda_sg.id
}

output "invocation_result" {
  description = "Result of the Lambda invocation (if auto_invoke is true)"
  value       = var.auto_invoke ? try(jsondecode(aws_lambda_invocation.db_init[0].result), null) : null
}
