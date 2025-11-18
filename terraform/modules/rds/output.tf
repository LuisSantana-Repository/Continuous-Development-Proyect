output "primary_db_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary.endpoint
}

output "primary_db_address" {
  description = "Address of the primary RDS instance"
  value       = aws_db_instance.primary.address
}

output "primary_db_name" {
  description = "Database name of the primary RDS instance"
  value       = aws_db_instance.primary.db_name
}

output "primary_db_port" {
  description = "Port of the primary RDS instance"
  value       = aws_db_instance.primary.port
}

output "secondary_db_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = var.enable_secondary_db ? aws_db_instance.secondary[0].endpoint : null
}

output "secondary_db_address" {
  description = "Address of the secondary RDS instance"
  value       = var.enable_secondary_db ? aws_db_instance.secondary[0].address : null
}

output "secondary_db_name" {
  description = "Database name of the secondary RDS instance"
  value       = var.enable_secondary_db ? aws_db_instance.secondary[0].db_name : null
}

output "secondary_db_port" {
  description = "Port of the secondary RDS instance"
  value       = var.enable_secondary_db ? aws_db_instance.secondary[0].port : null
}

output "rds_sg_id" {
  description = "Security group ID for RDS instances"
  value       = aws_security_group.rds.id
}


output "rds_security_group_id" {
  description = "Security group ID for RDS instances (alias)"
  value       = aws_security_group.rds.id
}
