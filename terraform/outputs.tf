# output "api_public_ip" {
#   description = "Public IP of API server"
#   value       = aws_instance.api.public_ip
# }

# output "api_public_dns" {
#   description = "Public DNS of API server"
#   value       = aws_instance.api.public_dns
# }

# output "stamin_up_public_ip" {
#   description = "Public IP of Stamin-Up server"
#   value       = aws_instance.stamin_up.public_ip
# }

# output "stamin_up_public_dns" {
#   description = "Public DNS of Stamin-Up server"
#   value       = aws_instance.stamin_up.public_dns
# }

# output "api_url" {
#   description = "API URL"
#   value       = "http://${aws_instance.api.public_ip}:3000"
# }

# output "stamin_up_url" {
#   description = "Stamin-Up URL"
#   value       = "http://${aws_instance.stamin_up.public_ip}"
# }



# ============================================
# OUTPUTS
# ============================================

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "web_instance_public_ip" {
  description = "Public IP of the web instance"
  value       = aws_instance.web.public_ip
}

# output "api_asg_name" {
#   description = "Name of the API Auto Scaling Group"
#   value       = aws_autoscaling_group.api.name
# }

# output "web_asg_name" {
#   description = "Name of the Web Auto Scaling Group"
#   value       = aws_autoscaling_group.web.name
# }
