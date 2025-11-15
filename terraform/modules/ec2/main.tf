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

  user_data = base64encode(templatefile("${path.module}/../../user_data_api.sh", {
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
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [var.app_sg_id]

  user_data = base64encode(templatefile("${path.module}/../../user_data_stamin.sh", {
    env_vars = var.stamin_env_vars
    alb_url  = "http://${var.alb_dns_name}"
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

# Attach web instance to target group
resource "aws_lb_target_group_attachment" "web" {
  target_group_arn = var.web_target_group_arn
  target_id        = aws_instance.web.id
  port             = 3001
}
