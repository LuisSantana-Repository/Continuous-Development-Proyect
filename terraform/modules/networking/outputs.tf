output "ubuntu_ami_id" {
  description = "ID of the Ubuntu AMI"
  value       = data.aws_ami.ubuntu.id
}

output "vpc_id" {
  description = "ID of the default VPC"
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "List of subnet IDs in the default VPC"
  value       = data.aws_subnets.default.ids
}
