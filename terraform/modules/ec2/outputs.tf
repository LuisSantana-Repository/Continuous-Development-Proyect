# output "web_instance_id" {
#   description = "ID of the web instance"
#   value       = aws_instance.web.id
# }

# output "web_instance_public_ip" {
#   description = "Public IP of the web instance"
#   value       = aws_instance.web.public_ip
# }

output "api_launch_template_id" {
  description = "ID of the API launch template"
  value       = aws_launch_template.api.id
}

output "web_launch_template_id" {
  description = "ID of the web launch template"
  value       = aws_launch_template.web.id
}

output "api_asg_name" {
  description = "Name of the API Auto Scaling Group"
  value       = aws_autoscaling_group.api.name
}

output "web_asg_name" {
  description = "Name of the Web Auto Scaling Group"
  value       = aws_autoscaling_group.web.name
}

output "api_asg_arn" {
  description = "ARN of the API Auto Scaling Group"
  value       = aws_autoscaling_group.api.arn
}

output "web_asg_arn" {
  description = "ARN of the Web Auto Scaling Group"
  value       = aws_autoscaling_group.web.arn
}