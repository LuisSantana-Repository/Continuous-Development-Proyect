output "api_parameter_names" {
  description = "Names of API SSM parameters"
  value       = [for k, v in aws_ssm_parameter.api_env_vars : v.name]
}

output "web_parameter_names" {
  description = "Names of Web SSM parameters"
  value       = [for k, v in aws_ssm_parameter.web_env_vars : v.name]
}
