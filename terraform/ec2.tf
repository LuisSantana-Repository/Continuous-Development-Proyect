# terraform/ec2.tf
# VERSIÓN OPTIMIZADA - Capacidades reducidas para desarrollo

# User Data Script para API
data "template_file" "api_user_data" {
  template = file("${path.module}/user_data_api.sh")
  
  vars = {
    aws_region                = var.aws_region
    db_primary_host           = aws_db_instance.primary.endpoint
    db_primary_name           = aws_db_instance.primary.db_name
    db_secondary_host         = var.enable_secondary_db ? aws_db_instance.secondary[0].endpoint : ""
    db_secondary_name         = var.enable_secondary_db ? aws_db_instance.secondary[0].db_name : ""
    db_username               = var.db_username
    db_password               = var.db_password
    jwt_secret                = var.jwt_secret
    s3_bucket                 = aws_s3_bucket.main.id
    dynamodb_table_sessions   = aws_dynamodb_table.sessions.name
    dynamodb_table_chats      = aws_dynamodb_table.chats.name
    dynamodb_table_messages   = aws_dynamodb_table.messages.name
  }
}

# User Data Script para Web
data "template_file" "web_user_data" {
  template = file("${path.module}/user_data_web.sh")
  
  vars = {
    api_url = "http://${aws_lb.main.dns_name}"
  }
}

# Launch Template - API
resource "aws_launch_template" "api" {
  name_prefix   = "${var.project_name}-api-"
  image_id      = var.ami_id
  instance_type = var.instance_type_api
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  key_name = var.ssh_key_name
  
  user_data = base64encode(data.template_file.api_user_data.rendered)
  
  # Detailed monitoring (cuesta extra, deshabilitar en desarrollo)
  monitoring {
    enabled = var.environment == "production" ? true : false
  }
  
  # IMDSv2 (seguridad)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 obligatorio
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }
  
  # EBS optimization
  ebs_optimized = false  # Deshabilitado para t3.micro (no soportado)
  
  # Block device mapping
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 20  # GB
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
      
      # OPTIMIZACIÓN: Sin IOPS/throughput adicional en desarrollo
      # iops       = var.environment == "production" ? 3000 : null
      # throughput = var.environment == "production" ? 125 : null
    }
  }
  
  tag_specifications {
    resource_type = "instance"
    
    tags = merge(
      var.common_tags,
      {
        Name        = "${var.project_name}-api-instance"
        Type        = "API"
        Environment = var.environment
      }
    )
  }
  
  tag_specifications {
    resource_type = "volume"
    
    tags = merge(
      var.common_tags,
      {
        Name        = "${var.project_name}-api-volume"
        Type        = "API"
        Environment = var.environment
      }
    )
  }
}

# Launch Template - Web
resource "aws_launch_template" "web" {
  name_prefix   = "${var.project_name}-web-"
  image_id      = var.ami_id
  instance_type = var.instance_type_web
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }
  
  vpc_security_group_ids = [aws_security_group.ec2_web.id]
  
  key_name = var.ssh_key_name
  
  user_data = base64encode(data.template_file.web_user_data.rendered)
  
  monitoring {
    enabled = var.environment == "production" ? true : false
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }
  
  ebs_optimized = false
  
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }
  
  tag_specifications {
    resource_type = "instance"
    
    tags = merge(
      var.common_tags,
      {
        Name        = "${var.project_name}-web-instance"
        Type        = "Web"
        Environment = var.environment
      }
    )
  }
  
  tag_specifications {
    resource_type = "volume"
    
    tags = merge(
      var.common_tags,
      {
        Name        = "${var.project_name}-web-volume"
        Type        = "Web"
        Environment = var.environment
      }
    )
  }
}

# Auto Scaling Group - API
# OPTIMIZACIÓN: Capacidad reducida a 1 instancia mínima
resource "aws_autoscaling_group" "api" {
  name = "${var.project_name}-api-asg"
  
  # Si NAT Gateway está deshabilitado, usar public subnets
  # Si no, usar private subnets
  vpc_zone_identifier = var.enable_nat_gateway ? aws_subnet.private_app[*].id : aws_subnet.public[*].id
  target_group_arns   = [aws_lb_target_group.api.arn]
  
  # OPTIMIZACIÓN: Reducir capacidad
  min_size         = var.api_min_size
  max_size         = var.api_max_size
  desired_capacity = var.api_desired_capacity
  
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  # OPTIMIZACIÓN: Termination policies para instancias más baratas
  termination_policies = ["OldestInstance", "Default"]
  
  launch_template {
    id      = aws_launch_template.api.id
    version = "$Latest"
  }
  
  # Métricas habilitadas
  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupTotalInstances"
  ]
  
  # Instance refresh (para updates con cero downtime)
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-api-asg-instance"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Type"
    value               = "API"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  
  # Tags comunes
  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Group - Web
resource "aws_autoscaling_group" "web" {
  name                = "${var.project_name}-web-asg"
  vpc_zone_identifier = var.enable_nat_gateway ? aws_subnet.private_app[*].id : aws_subnet.public[*].id
  target_group_arns   = [aws_lb_target_group.web.arn]
  
  min_size         = var.web_min_size
  max_size         = var.web_max_size
  desired_capacity = var.web_desired_capacity
  
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  termination_policies = ["OldestInstance", "Default"]
  
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
  
  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupTotalInstances"
  ]
  
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-web-asg-instance"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Type"
    value               = "Web"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policy - API (CPU-based)
resource "aws_autoscaling_policy" "api_cpu" {
  name                   = "${var.project_name}-api-cpu-policy"
  autoscaling_group_name = aws_autoscaling_group.api.name
  policy_type            = "TargetTrackingScaling"
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    # OPTIMIZACIÓN: Mayor threshold para escalar menos agresivamente
    target_value = var.environment == "production" ? 70.0 : 80.0
  }
}

# Auto Scaling Policy - Web (CPU-based)
resource "aws_autoscaling_policy" "web_cpu" {
  name                   = "${var.project_name}-web-cpu-policy"
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type            = "TargetTrackingScaling"
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.environment == "production" ? 70.0 : 80.0
  }
}

# Auto Scaling Policy - API (Request Count - opcional)
resource "aws_autoscaling_policy" "api_requests" {
  count = var.environment == "production" ? 1 : 0
  
  name                   = "${var.project_name}-api-requests-policy"
  autoscaling_group_name = aws_autoscaling_group.api.name
  policy_type            = "TargetTrackingScaling"
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.api.arn_suffix}"
    }
    target_value = 1000.0  # Requests por target
  }
}

# CloudWatch Alarms - CPU (opcional)
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  count = var.environment == "production" ? 1 : 0
  
  alarm_name          = "${var.project_name}-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "This metric monitors API EC2 CPU utilization"
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api.name
  }
  
  # actions_enabled = true
  # alarm_actions   = [aws_sns_topic.alerts[0].arn]
}

# Outputs
output "api_asg_name" {
  description = "API Auto Scaling Group name"
  value       = aws_autoscaling_group.api.name
}

output "web_asg_name" {
  description = "Web Auto Scaling Group name"
  value       = aws_autoscaling_group.web.name
}

output "api_launch_template_id" {
  description = "API Launch Template ID"
  value       = aws_launch_template.api.id
}

output "web_launch_template_id" {
  description = "Web Launch Template ID"
  value       = aws_launch_template.web.id
}
