# DB Subnet Group (required for RDS)
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name    = "${var.project_name}-db-subnet-group"
    Project = var.project_name
  }
}

# Security Group for RDS instances
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS MySQL instances"
  vpc_id      = var.vpc_id

  # Allow MySQL access from app instances
  ingress {
    description     = "MySQL from app instances"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.app_sg_id]
  }

    # Allow MySQL access from anywhere
    ingress {
    description     = "MySQL from app instances"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    cidr_blocks     = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-rds-sg"
    Project = var.project_name
  }
}

# Primary RDS Instance (my-sql-rds-hot)
resource "aws_db_instance" "primary" {
  identifier     = "${var.project_name}-primary-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 30
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "my_sql_rds_hot"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false


  # Multi-AZ for high availability (set to false for cost savings in dev)
  multi_az = var.enable_multi_az

# Backups
#   backup_retention_period = var.backup_retention_period
#   backup_window          = "03:00-04:00"
#   maintenance_window     = "mon:04:00-mon:05:00"

  # Performance and monitoring
#   enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
#   monitoring_interval             = 60
#   monitoring_role_arn            = aws_iam_role.rds_monitoring.arn

  # Deletion protection
  deletion_protection = var.enable_deletion_protection
  skip_final_snapshot = !var.enable_deletion_protection
  final_snapshot_identifier = var.enable_deletion_protection ? "${var.project_name}-secondary-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null


  tags = {
    Name    = "${var.project_name}-primary-db"
    Project = var.project_name
    Type    = "primary"
  }
}

# Secondary RDS Instance (rds cold)
resource "aws_db_instance" "secondary" {
  count = var.enable_secondary_db ? 1 : 0

  identifier     = "${var.project_name}-secondary-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "analytics_db"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backups
#   backup_retention_period = var.backup_retention_period
#   backup_window          = "03:00-04:00"
#   maintenance_window     = "mon:04:00-mon:05:00"

  # Multi-AZ
  multi_az = var.enable_multi_az

  # Performance and monitoring
#   enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
#   monitoring_interval             = 60
#   monitoring_role_arn            = aws_iam_role.rds_monitoring.arn

  # Deletion protection
  deletion_protection = var.enable_deletion_protection
  skip_final_snapshot = !var.enable_deletion_protection
  final_snapshot_identifier = var.enable_deletion_protection ? "${var.project_name}-secondary-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  tags = {
    Name    = "${var.project_name}-secondary-db"
    Project = var.project_name
    Type    = "secondary"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "${var.project_name}-rds-monitoring-role"
    Project = var.project_name
  }
}

# Attach AWS managed policy for RDS monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}