# SSH Key Pair
resource "aws_key_pair" "main" {
  key_name   = "aws-ec2"
  public_key = file(var.ssh_public_key_path)
}

# Launch Template para API
resource "aws_launch_template" "api" {
  name_prefix   = "${var.project_name}-api-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [var.app_sg_id]

  # IAM instance profile for S3 access
  iam_instance_profile {
    name = var.iam_instance_profile_name
  }

  user_data = base64encode(templatefile("${path.module}/../../user_data_api.sh", {
    aws_region   = var.aws_region
    project_name = var.project_name
    ecr_api_url  = var.ecr_api_url
  }))

  block_device_mappings {
    device_name = "/dev/sda1"

    ebs {
      volume_size = 8
      volume_type = "gp3"
    }
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name    = "${var.project_name}-api"
      Project = var.project_name
      Service = "api"
    }
  }
}

# Launch Template para Frontend
resource "aws_launch_template" "web" {
  name_prefix   = "${var.project_name}-web-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [var.app_sg_id]

  # IAM instance profile for S3 access
  iam_instance_profile {
    name = var.iam_instance_profile_name
  }
  
  user_data = base64encode(templatefile("${path.module}/../../user_data_stamin.sh", {
    aws_region   = var.aws_region
    project_name = var.project_name
    ecr_web_url  = var.ecr_web_url
  }))

  block_device_mappings {
    device_name = "/dev/sda1"

    ebs {
      volume_size = 8
      volume_type = "gp3"
    }
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name    = "${var.project_name}-web"
      Project = var.project_name
      Service = "stamin-up"
    }
  }
}

# Web Instance
resource "aws_instance" "web" {
  ami           = aws_launch_template.web.image_id
  instance_type = aws_launch_template.web.instance_type
  vpc_security_group_ids = [var.app_sg_id]

  launch_template {
    id      = aws_launch_template.web.id
  }

  tags = {
    Name = "webInstanceFromTemplate"
  }
}

# # Attach web instance to target group
# resource "aws_lb_target_group_attachment" "web" {
#   target_group_arn = var.web_target_group_arn
#   target_id        = aws_instance.web.id
#   port             = 3001
# }


 resource "aws_instance" "api" {
    ami           = aws_launch_template.api.image_id
    instance_type = aws_launch_template.api.instance_type
    vpc_security_group_ids = [var.app_sg_id]

    launch_template {
      id      = aws_launch_template.api.id
    }

    tags = {
      Name = "apiInstanceFromTemplate"
    }
  }



# # EC2 para API
# resource "aws_instance" "api" {
#   ami           = data.aws_ami.ubuntu.id
#   instance_type = var.instance_type
#   key_name      = aws_key_pair.main.key_name

#   vpc_security_group_ids = [aws_security_group.app_sg.id]

#   user_data = templatefile("${path.module}/user_data_api.sh", {
#     env_vars = var.api_env_vars
#   })

#   tags = {
#     Name    = "${var.project_name}-api"
#     Project = var.project_name
#     Service = "api"
#   }

#   root_block_device {
#     volume_size = 8
#     volume_type = "gp3"
#   }
# }

# EC2 para Stamin-Up Frontend
# resource "aws_instance" "stamin_up" {
#   ami           =  data.aws_ami.ubuntu.id
#   instance_type = var.instance_type
#   key_name      = aws_key_pair.main.key_name

#   vpc_security_group_ids = [aws_security_group.app_sg.id]

#   user_data = templatefile("${path.module}/user_data_stamin.sh", {
#     env_vars = var.stamin_env_vars
#   })

#   tags = {
#     Name    = "${var.project_name}-stamin-up"
#     Project = var.project_name
#     Service = "stamin-up"
#   }

#   root_block_device {
#     volume_size = 8
#     volume_type = "gp3"
#   }
# }




# ============================================
# AUTO SCALING GROUPS
# ============================================

# Auto Scaling Group para API
resource "aws_autoscaling_group" "api" {
  name                      = "${var.project_name}-api-asg"
  vpc_zone_identifier       = var.subnet_ids
  target_group_arns         = [var.api_target_group_arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.api_min_size
  max_size         = var.api_max_size
  desired_capacity = var.api_desired_capacity

  launch_template {
    id      = aws_launch_template.api.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-api-asg"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "Service"
    value               = "api"
    propagate_at_launch = true
  }
}

# Auto Scaling Group para Frontend
resource "aws_autoscaling_group" "web" {
  name                      = "${var.project_name}-web-asg"
  vpc_zone_identifier       = var.subnet_ids
  target_group_arns         = [var.web_target_group_arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.web_min_size
  max_size         = var.web_max_size
  desired_capacity = var.web_desired_capacity

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-web-asg"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "Service"
    value               = "stamin-up"
    propagate_at_launch = true
  }
}

# ============================================
# AUTO SCALING POLICIES - CPU BASED
# ============================================

# Policy para escalar API hacia arriba (scale out)
resource "aws_autoscaling_policy" "api_scale_up" {
  name                   = "${var.project_name}-api-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.api.name
}

# CloudWatch Alarm para CPU > 70% en API
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "${var.project_name}-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors API EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.api_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api.name
  }
}

# Policy para escalar API hacia abajo (scale in)
resource "aws_autoscaling_policy" "api_scale_down" {
  name                   = "${var.project_name}-api-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.api.name
}

# CloudWatch Alarm para CPU < 30% en API
resource "aws_cloudwatch_metric_alarm" "api_cpu_low" {
  alarm_name          = "${var.project_name}-api-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors API EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.api_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api.name
  }
}

# # Policy para escalar WEB hacia arriba (scale out)
resource "aws_autoscaling_policy" "web_scale_up" {
  name                   = "${var.project_name}-web-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

# CloudWatch Alarm para CPU > 70% en WEB
resource "aws_cloudwatch_metric_alarm" "web_cpu_high" {
  alarm_name          = "${var.project_name}-web-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors WEB EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.web_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }
}

# Policy para escalar WEB hacia abajo (scale in)
resource "aws_autoscaling_policy" "web_scale_down" {
  name                   = "${var.project_name}-web-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

# CloudWatch Alarm para CPU < 30% en WEB
resource "aws_cloudwatch_metric_alarm" "web_cpu_low" {
  alarm_name          = "${var.project_name}-web-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors WEB EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.web_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }
}
