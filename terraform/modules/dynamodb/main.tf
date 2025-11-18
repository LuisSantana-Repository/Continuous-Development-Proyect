# DynamoDB Table: sessions
resource "aws_dynamodb_table" "sessions" {
  name           = "${var.project_name}-sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # TTL for automatic session cleanup
  ttl {
    attribute_name = "ttl"
    enabled        = var.enable_ttl
  }

  # Enable point-in-time recovery (optional)
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-sessions"
    Project     = var.project_name
    Environment = var.environment
  }
}

# DynamoDB Table: chats
resource "aws_dynamodb_table" "chats" {
  name           = "${var.project_name}-chats"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "chat_id"

  attribute {
    name = "chat_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "provider_id"
    type = "N"
  }

  # Global Secondary Index: UserProviderIndex
  global_secondary_index {
    name            = "UserProviderIndex"
    hash_key        = "user_id"
    range_key       = "provider_id"
    projection_type = "ALL"
  }

  # Global Secondary Index: ProviderIndex
  global_secondary_index {
    name            = "ProviderIndex"
    hash_key        = "provider_id"
    projection_type = "ALL"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-chats"
    Project     = var.project_name
    Environment = var.environment
  }
}

# DynamoDB Table: messages
resource "aws_dynamodb_table" "messages" {
  name           = "${var.project_name}-messages"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "chat_id"
  range_key      = "timestamp"

  attribute {
    name = "chat_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "message_id"
    type = "S"
  }

  # Global Secondary Index: MessageIdIndex
  global_secondary_index {
    name            = "MessageIdIndex"
    hash_key        = "message_id"
    projection_type = "ALL"
  }

  # TTL for automatic message cleanup (optional)
  ttl {
    attribute_name = "ttl"
    enabled        = var.enable_ttl
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Stream for real-time updates (optional)
  stream_enabled   = var.enable_streams
  stream_view_type = var.enable_streams ? "NEW_AND_OLD_IMAGES" : null

  tags = {
    Name        = "${var.project_name}-messages"
    Project     = var.project_name
    Environment = var.environment
  }
}

# IAM Policy for DynamoDB access (to be attached to EC2 role)
resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.project_name}-dynamodb-access-policy"
  role = var.ec2_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.sessions.arn,
          "${aws_dynamodb_table.sessions.arn}/*",
          aws_dynamodb_table.chats.arn,
          "${aws_dynamodb_table.chats.arn}/*",
          aws_dynamodb_table.messages.arn,
          "${aws_dynamodb_table.messages.arn}/*"
        ]
      }
    ]
  })
}
