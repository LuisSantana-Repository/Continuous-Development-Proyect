output "web_instance_id" {
  description = "ID of the web instance"
  value       = aws_instance.web.id
}

output "web_instance_public_ip" {
  description = "Public IP of the web instance"
  value       = aws_instance.web.public_ip
}

output "api_launch_template_id" {
  description = "ID of the API launch template"
  value       = aws_launch_template.api.id
}

output "web_launch_template_id" {
  description = "ID of the web launch template"
  value       = aws_launch_template.web.id
}
