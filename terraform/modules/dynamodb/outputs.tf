output "sessions_table_name" {
  description = "Name of the sessions DynamoDB table"
  value       = aws_dynamodb_table.sessions.name
}

output "sessions_table_arn" {
  description = "ARN of the sessions DynamoDB table"
  value       = aws_dynamodb_table.sessions.arn
}

output "chats_table_name" {
  description = "Name of the chats DynamoDB table"
  value       = aws_dynamodb_table.chats.name
}

output "chats_table_arn" {
  description = "ARN of the chats DynamoDB table"
  value       = aws_dynamodb_table.chats.arn
}

output "messages_table_name" {
  description = "Name of the messages DynamoDB table"
  value       = aws_dynamodb_table.messages.name
}

output "messages_table_arn" {
  description = "ARN of the messages DynamoDB table"
  value       = aws_dynamodb_table.messages.arn
}

output "messages_stream_arn" {
  description = "ARN of the messages table stream (if enabled)"
  value       = var.enable_streams ? aws_dynamodb_table.messages.stream_arn : null
}

output "all_table_names" {
  description = "List of all DynamoDB table names"
  value = {
    sessions = aws_dynamodb_table.sessions.name
    chats    = aws_dynamodb_table.chats.name
    messages = aws_dynamodb_table.messages.name
  }
}
