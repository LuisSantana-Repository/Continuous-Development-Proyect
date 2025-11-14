output "api_public_ip" {
  description = "Public IP of API server"
  value       = aws_instance.api.public_ip
}

output "api_public_dns" {
  description = "Public DNS of API server"
  value       = aws_instance.api.public_dns
}

output "stamin_up_public_ip" {
  description = "Public IP of Stamin-Up server"
  value       = aws_instance.stamin_up.public_ip
}

output "stamin_up_public_dns" {
  description = "Public DNS of Stamin-Up server"
  value       = aws_instance.stamin_up.public_dns
}

output "api_url" {
  description = "API URL"
  value       = "http://${aws_instance.api.public_ip}:3000"
}

output "stamin_up_url" {
  description = "Stamin-Up URL"
  value       = "http://${aws_instance.stamin_up.public_ip}"
}
