# SSM Parameters for API Environment Variables
resource "aws_ssm_parameter" "api_env_vars" {
  for_each = var.api_env_vars

  name  = "/${var.project_name}/api/${each.key}"
  type  = contains(var.sensitive_keys, each.key) ? "SecureString" : "String"
  value = each.value

  tags = {
    Name        = "${var.project_name}-api-${each.key}"
    Project     = var.project_name
    Environment = "production"
    Service     = "api"
  }
}

# SSM Parameters for Web Environment Variables
resource "aws_ssm_parameter" "web_env_vars" {
  for_each = var.web_env_vars

  name  = "/${var.project_name}/web/${each.key}"
  type  = contains(var.sensitive_keys, each.key) ? "SecureString" : "String"
  value = each.value

  tags = {
    Name        = "${var.project_name}-web-${each.key}"
    Project     = var.project_name
    Environment = "production"
    Service     = "web"
  }
}
