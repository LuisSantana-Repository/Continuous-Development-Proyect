# Configuración básica
aws_region   = "us-east-1"
project_name = "stamin-up"
instance_type = "t2.micro"

# IMPORTANTE: Cambia este valor por el nombre de tu key pair en AWS
key_name = "lorem_ipsum"


# ============================================
# RDS Database Configuration
# ============================================
db_instance_class          = "db.t3.micro"
db_username                = "admin"
db_password                = "3deAsada."  # CHANGE THIS IN PRODUCTION!
enable_multi_az            = false        # Set to true for production HA
enable_secondary_db        = true         # Enable analytics database
backup_retention_period    = 1            # Days to keep backups
enable_deletion_protection = false        # Set to true for production


# ============================================
# Variables de entorno para la API
# ============================================
# Note: DB credentials will be automatically injected from RDS module
api_env_vars = {
  PORT        = "3000"
  NODE_ENV    = "production"
  JWT_SECRET  = "your-super-secret-jwt-key-change-in-production"
  CORS_ORIGIN = "0.0.0.0"
  REDIS_HOST  = "0.0.0.0"
  REDIS_PORT  = "6379"
}

# ============================================
# Variables de entorno para Stamin-Up
# ============================================
stamin_env_vars = {
  NODE_ENV="development"
  NEXT_TELEMETRY_DISABLED=1
}
# ============================================
# S3 Configuration
# ============================================
s3_environment             = "prod"
s3_enable_versioning       = false        # Set to true for production
s3_enable_logging          = false        # Set to true for production
s3_enable_lifecycle_rules  = true         # Cost optimization
s3_transition_to_ia_days   = 90           # Move to IA after 90 days
s3_transition_to_glacier_days = 180       # Move to Glacier after 180 days
s3_expiration_days         = 0            # Never expire (set to 365 for 1 year)
s3_cors_allowed_origins    = ["*"]        # Allow all origins

# ============================================
# DynamoDB Configuration
# ============================================
dynamodb_environment       = "prod"
dynamodb_enable_ttl        = true         # Auto-expire old items
dynamodb_enable_pitr       = false        # Set to true for production backups
dynamodb_enable_streams    = false        # Set to true for real-time triggers


iam_instance_profile_name = "stamin-up-ec2-profile"