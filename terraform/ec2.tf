data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Usa la VPC por defecto
data "aws_vpc" "default" {
  default = true
}

# Obtiene las subnets de la VPC por defecto
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_key_pair" "main" {
  key_name   = "aws-ec2"
  public_key = file("${path.module}/aws-ec2.pub")
}

# ============================================
# SECURITY GROUPS
# ============================================
# Security Group para ALB
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-alb-sg"
    Project = var.project_name
  }
}

# Security Group para instancias EC2
# resource "aws_security_group" "app_sg" {
#   name        = "${var.project_name}-app-sg"
#   description = "Security group for EC2 instances"
#   vpc_id      = data.aws_vpc.default.id

#   ingress {
#     description = "SSH"
#     from_port   = 22
#     to_port     = 22
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   ingress {
#     description     = "HTTP from ALB"
#     from_port       = 3001
#     to_port         = 3001
#     protocol        = "tcp"
#     security_groups = [aws_security_group.alb_sg.id]
#   }

#   ingress {
#     description     = "API Port from ALB"
#     from_port       = 3000
#     to_port         = 3000
#     protocol        = "tcp"
#     security_groups = [aws_security_group.alb_sg.id]
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   tags = {
#     Name    = "${var.project_name}-app-sg"
#     Project = var.project_name
#   }
# }



resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "Security group for EC2 instances"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "HTTP from ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "API Port from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-app-sg"
    Project = var.project_name
  }
}







# ============================================
# APPLICATION LOAD BALANCER
# ============================================
# resource "aws_lb" "main" {
#   name               = "${var.project_name}-alb"
#   internal           = false
#   load_balancer_type = "application"
#   security_groups    = [aws_security_group.alb_sg.id]
#   subnets            = data.aws_subnets.default.ids

#   enable_deletion_protection = false

#   tags = {
#     Name    = "${var.project_name}-alb"
#     Project = var.project_name
#   }
# }

# # Target Group para API (puerto 3000)
# resource "aws_lb_target_group" "api" {
#   name     = "${var.project_name}-api-tg"
#   port     = 3000
#   protocol = "HTTP"
#   vpc_id   = data.aws_vpc.default.id

#   health_check {
#     enabled             = true
#     healthy_threshold   = 2
#     unhealthy_threshold = 2
#     timeout             = 5
#     interval            = 30
#     path                = "/health"
#     matcher             = "200"
#   }

#   deregistration_delay = 10

#   tags = {
#     Name    = "${var.project_name}-api-tg"
#     Project = var.project_name
#   }
# }

# # Target Group para Frontend (puerto 3001)
# resource "aws_lb_target_group" "web" {
#   name     = "${var.project_name}-web-tg"
#   port     = 3001
#   protocol = "HTTP"
#   vpc_id   = data.aws_vpc.default.id

#   health_check {
#     enabled             = true
#     healthy_threshold   = 2
#     unhealthy_threshold = 2
#     timeout             = 5
#     interval            = 30
#     path                = "/"
#     matcher             = "200"
#   }

#   deregistration_delay = 30

#   tags = {
#     Name    = "${var.project_name}-web-tg"
#     Project = var.project_name
#   }
# }


# # Listener HTTP (puerto 80) para el ALB
# resource "aws_lb_listener" "http" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "80"
#   protocol          = "HTTP"

#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.web.arn
#   }
# }

# # Regla para routear /api/* al target group de la API
# resource "aws_lb_listener_rule" "api" {
#   listener_arn = aws_lb_listener.http.arn
#   priority     = 100

#   action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.api.arn
#   }

#   condition {
#     path_pattern {
#       values = ["/api/*"]
#     }
#   }
# }

# ============================================
# LAUNCH TEMPLATES
# ============================================


# Launch Template para API
resource "aws_launch_template" "api" {
  name_prefix   = "${var.project_name}-api-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  user_data = base64encode(templatefile("${path.module}/user_data_api.sh", {
    env_vars = var.api_env_vars
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
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  user_data = base64encode(templatefile("${path.module}/user_data_stamin.sh", {
    env_vars = var.stamin_env_vars
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


resource "aws_instance" "web" {
      ami           = aws_launch_template.web.image_id
      instance_type = aws_launch_template.web.instance_type
      vpc_security_group_ids = [aws_security_group.app_sg.id]

      launch_template {
        id      = aws_launch_template.web.id
      }

      tags = {
        Name = "webInstanceFromTemplate"
      }
    }



# resource "aws_instance" "api" {
#       ami           = aws_launch_template.api.image_id
#       instance_type = aws_launch_template.api.instance_type
#       vpc_security_group_ids = [aws_security_group.app_sg.id]

#       launch_template {
#         id      = aws_launch_template.api.id
#       }

#       tags = {
#         Name = "apiInstanceFromTemplate"
#       }
#     }



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









# # ============================================
# # AUTO SCALING GROUPS
# # ============================================

# # Auto Scaling Group para API
# resource "aws_autoscaling_group" "api" {
#   name                = "${var.project_name}-api-asg"
#   vpc_zone_identifier = data.aws_subnets.default.ids
#   target_group_arns   = [aws_lb_target_group.api.arn]
#   health_check_type   = "ELB"
#   health_check_grace_period = 300

#   min_size         = var.api_min_size
#   max_size         = var.api_max_size
#   desired_capacity = var.api_desired_capacity

#   launch_template {
#     id      = aws_launch_template.api.id
#     version = "$Latest"
#   }

#   tag {
#     key                 = "Name"
#     value               = "${var.project_name}-api-asg"
#     propagate_at_launch = true
#   }

#   tag {
#     key                 = "Project"
#     value               = var.project_name
#     propagate_at_launch = true
#   }

#   tag {
#     key                 = "Service"
#     value               = "api"
#     propagate_at_launch = true
#   }
# }

# # Auto Scaling Group para Frontend
# resource "aws_autoscaling_group" "web" {
#   name                = "${var.project_name}-web-asg"
#   vpc_zone_identifier = data.aws_subnets.default.ids
#   target_group_arns   = [aws_lb_target_group.web.arn]
#   health_check_type   = "ELB"
#   health_check_grace_period = 300

#   min_size         = var.web_min_size
#   max_size         = var.web_max_size
#   desired_capacity = var.web_desired_capacity

#   launch_template {
#     id      = aws_launch_template.web.id
#     version = "$Latest"
#   }

#   tag {
#     key                 = "Name"
#     value               = "${var.project_name}-web-asg"
#     propagate_at_launch = true
#   }

#   tag {
#     key                 = "Project"
#     value               = var.project_name
#     propagate_at_launch = true
#   }

#   tag {
#     key                 = "Service"
#     value               = "stamin-up"
#     propagate_at_launch = true
#   }
# }







# ============================================
# AUTO SCALING POLICIES - CPU BASED
# ============================================

# Policy para escalar API hacia arriba (scale out)
# resource "aws_autoscaling_policy" "api_scale_up" {
#   name                   = "${var.project_name}-api-scale-up"
#   scaling_adjustment     = 1
#   adjustment_type        = "ChangeInCapacity"
#   cooldown              = 300
#   autoscaling_group_name = aws_autoscaling_group.api.name
# }

# # CloudWatch Alarm para CPU > 70% en API
# resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
#   alarm_name          = "${var.project_name}-api-cpu-high"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "CPUUtilization"
#   namespace           = "AWS/EC2"
#   period              = "120"
#   statistic           = "Average"
#   threshold           = "70"
#   alarm_description   = "This metric monitors API EC2 CPU utilization"
#   alarm_actions       = [aws_autoscaling_policy.api_scale_up.arn]

#   dimensions = {
#     AutoScalingGroupName = aws_autoscaling_group.api.name
#   }
# }

# # Policy para escalar API hacia abajo (scale in)
# resource "aws_autoscaling_policy" "api_scale_down" {
#   name                   = "${var.project_name}-api-scale-down"
#   scaling_adjustment     = -1
#   adjustment_type        = "ChangeInCapacity"
#   cooldown              = 300
#   autoscaling_group_name = aws_autoscaling_group.api.name
# }

# # CloudWatch Alarm para CPU < 30% en API
# resource "aws_cloudwatch_metric_alarm" "api_cpu_low" {
#   alarm_name          = "${var.project_name}-api-cpu-low"
#   comparison_operator = "LessThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "CPUUtilization"
#   namespace           = "AWS/EC2"
#   period              = "120"
#   statistic           = "Average"
#   threshold           = "30"
#   alarm_description   = "This metric monitors API EC2 CPU utilization"
#   alarm_actions       = [aws_autoscaling_policy.api_scale_down.arn]

#   dimensions = {
#     AutoScalingGroupName = aws_autoscaling_group.api.name
#   }
# }

# # Policy para escalar WEB hacia arriba (scale out)
# resource "aws_autoscaling_policy" "web_scale_up" {
#   name                   = "${var.project_name}-web-scale-up"
#   scaling_adjustment     = 1
#   adjustment_type        = "ChangeInCapacity"
#   cooldown              = 300
#   autoscaling_group_name = aws_autoscaling_group.web.name
# }

# # CloudWatch Alarm para CPU > 70% en WEB
# resource "aws_cloudwatch_metric_alarm" "web_cpu_high" {
#   alarm_name          = "${var.project_name}-web-cpu-high"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "CPUUtilization"
#   namespace           = "AWS/EC2"
#   period              = "120"
#   statistic           = "Average"
#   threshold           = "70"
#   alarm_description   = "This metric monitors WEB EC2 CPU utilization"
#   alarm_actions       = [aws_autoscaling_policy.web_scale_up.arn]

#   dimensions = {
#     AutoScalingGroupName = aws_autoscaling_group.web.name
#   }
# }

# # Policy para escalar WEB hacia abajo (scale in)
# resource "aws_autoscaling_policy" "web_scale_down" {
#   name                   = "${var.project_name}-web-scale-down"
#   scaling_adjustment     = -1
#   adjustment_type        = "ChangeInCapacity"
#   cooldown              = 300
#   autoscaling_group_name = aws_autoscaling_group.web.name
# }

# # CloudWatch Alarm para CPU < 30% en WEB
# resource "aws_cloudwatch_metric_alarm" "web_cpu_low" {
#   alarm_name          = "${var.project_name}-web-cpu-low"
#   comparison_operator = "LessThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "CPUUtilization"
#   namespace           = "AWS/EC2"
#   period              = "120"
#   statistic           = "Average"
#   threshold           = "30"
#   alarm_description   = "This metric monitors WEB EC2 CPU utilization"
#   alarm_actions       = [aws_autoscaling_policy.web_scale_down.arn]

#   dimensions = {
#     AutoScalingGroupName = aws_autoscaling_group.web.name
#   }
# }
