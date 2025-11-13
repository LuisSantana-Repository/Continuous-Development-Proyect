# terraform/s3_dynamodb.tf

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${var.environment}-bucket"
  force_destroy = true
  tags = {
    Name = "${var.project_name}-main-bucket"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]  # Actualizar con tu dominio en producción
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# DynamoDB Table - Sessions
resource "aws_dynamodb_table" "sessions" {
  name           = "sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  ttl {
    attribute_name = "expireAt"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name = "${var.project_name}-sessions-table"
  }
}

# DynamoDB Table - Chats
resource "aws_dynamodb_table" "chats" {
  name           = "chats"
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
  
  global_secondary_index {
    name            = "UserProviderIndex"
    hash_key        = "user_id"
    range_key       = "provider_id"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "ProviderIndex"
    hash_key        = "provider_id"
    projection_type = "ALL"
  }
  point_in_time_recovery {
    enabled = false
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name = "${var.project_name}-chats-table"
  }
}

# DynamoDB Table - Messages
resource "aws_dynamodb_table" "messages" {
  name           = "messages"
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
  
  global_secondary_index {
    name            = "MessageIdIndex"
    hash_key        = "message_id"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = false
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name = "${var.project_name}-messages-table"
  }
}
