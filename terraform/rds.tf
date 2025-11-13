# terraform/rds.tf
# VERSIÓN OPTIMIZADA - Desarrollo de bajo costo

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id
  
  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
  }
}

# RDS Primary (Hot Database)
# CAMBIOS: 
# - deletion_protection = false (permite terraform destroy)
# - multi_az = false (ahorra ~$33/mes en desarrollo)
# - backup_retention_period = 1 (mínimo necesario)
# - enabled_cloudwatch_logs_exports solo errors (reduce costos)
resource "aws_db_instance" "primary" {
  identifier        = "${var.project_name}-primary-db"
  engine            = "mysql"
  engine_version    = "8.0.35"
  instance_class    = var.db_instance_class_primary
  allocated_storage = 20  # Aumentado de 10 a 20 (mínimo para gp3)
  storage_type      = "gp3"
  storage_encrypted = true
  
  db_name  = "my_sql_rds_hot"
  username = var.db_username
  password = var.db_password
  
  # OPTIMIZACIÓN: Single-AZ en desarrollo
  multi_az               = var.environment == "production" ? true : false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  # OPTIMIZACIÓN: Backups mínimos
  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  # OPTIMIZACIÓN: Solo logs de error en desarrollo
  enabled_cloudwatch_logs_exports = var.environment == "production" ? ["error", "general", "slowquery"] : ["error"]
  
  # CRÍTICO: Debe ser false para permitir terraform destroy
  skip_final_snapshot       = var.environment == "production" ? false : true
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-primary-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  # CRÍTICO: Debe ser false para permitir terraform destroy
  deletion_protection = var.environment == "production" ? true : false
  
  # Performance Insights (opcional, cuesta extra)
  performance_insights_enabled = false
  
  tags = {
    Name        = "${var.project_name}-primary-db"
    Type        = "Primary"
    Environment = var.environment
  }
}

# RDS Secondary (Analytics Database)
# NOTA: Considera si realmente necesitas una segunda base de datos
# ALTERNATIVA: Usa múltiples schemas en la base de datos primaria
# Para habilitar, cambia count = 1
resource "aws_db_instance" "secondary" {
  count = var.enable_secondary_db ? 1 : 0  # Condicional
  
  identifier        = "${var.project_name}-secondary-db"
  engine            = "mysql"
  engine_version    = "8.0.35"
  instance_class    = var.db_instance_class_secondary
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  
  db_name  = "analytics_db"
  username = var.db_username
  password = var.db_password
  
  # OPTIMIZACIÓN: Single-AZ en desarrollo
  multi_az               = var.environment == "production" ? true : false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  # OPTIMIZACIÓN: Backups mínimos
  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  # OPTIMIZACIÓN: Solo logs de error
  enabled_cloudwatch_logs_exports = ["error"]
  
  # CRÍTICO: Debe ser false para permitir terraform destroy
  skip_final_snapshot       = var.environment == "production" ? false : true
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-secondary-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  # CRÍTICO: Cambiar a false para permitir terraform destroy
  deletion_protection = false
  
  # Performance Insights
  performance_insights_enabled = false
  
  tags = {
    Name        = "${var.project_name}-secondary-db"
    Type        = "Secondary"
    Environment = var.environment
  }
}

# Output condicional para secondary DB
output "secondary_db_endpoint" {
  description = "Secondary database endpoint"
  value       = var.enable_secondary_db ? aws_db_instance.secondary[0].endpoint : "N/A - Secondary DB disabled"
}
