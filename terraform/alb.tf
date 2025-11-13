# terraform/alb.tf
# VERSIÓN OPTIMIZADA - Con correcciones para terraform destroy

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  # CRÍTICO: Debe ser false para permitir terraform destroy
  enable_deletion_protection       = var.environment == "production" ? true : false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true
  
  # OPTIMIZACIÓN: Idle timeout
  idle_timeout = 60
  
  # OPTIMIZACIÓN: Access logs (deshabilitado por defecto para ahorrar)
  # access_logs {
  #   bucket  = aws_s3_bucket.alb_logs.bucket
  #   enabled = true
  # }
  
  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
  }
}

# Target Group - API
resource "aws_lb_target_group" "api" {
  name     = "${var.project_name}-api-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"  # Cambiar a /health si existe
    protocol            = "HTTP"
    matcher             = "200"
  }
  
  # OPTIMIZACIÓN: Reducir delay de deregistration
  deregistration_delay = 30
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  tags = {
    Name        = "${var.project_name}-api-tg"
    Environment = var.environment
  }
}

# Target Group - Web
resource "aws_lb_target_group" "web" {
  name     = "${var.project_name}-web-tg"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
  }
  
  deregistration_delay = 30
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  tags = {
    Name        = "${var.project_name}-web-tg"
    Environment = var.environment
  }
}

# ALB Listener - HTTP
# VERSIÓN SIMPLE: Forward directo (sin HTTPS por ahora)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  # Si HTTPS está habilitado, redirigir
  # Si no, forward directo
  default_action {
    type = var.enable_https ? "redirect" : "forward"
    
    dynamic "redirect" {
      for_each = var.enable_https ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    
    target_group_arn = var.enable_https ? null : aws_lb_target_group.web.arn
  }
}

# HTTPS Listener - Solo si está habilitado
resource "aws_lb_listener" "https" {
  count = var.enable_https ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"  # Actualizado a TLS 1.3
  certificate_arn   = aws_acm_certificate.main[0].arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# ALB Listener Rule - API paths (para HTTPS)
resource "aws_lb_listener_rule" "api_https" {
  count = var.enable_https ? 1 : 0
  
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*", "/health", "/auth/*"]
    }
  }
}

# ALB Listener Rule - API paths (para HTTP si HTTPS no está habilitado)
resource "aws_lb_listener_rule" "api_http" {
  count = var.enable_https ? 0 : 1
  
  listener_arn = aws_lb_listener.http.arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*", "/health", "/auth/*"]
    }
  }
}

# ACM Certificate - Solo si HTTPS está habilitado
resource "aws_acm_certificate" "main" {
  count = var.enable_https && var.domain_name != "" ? 1 : 0
  
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  subject_alternative_names = [
    "*.${var.domain_name}"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name        = "${var.project_name}-certificate"
    Environment = var.environment
  }
}

# NOTA: Para validar el certificado, necesitas agregar records en Route53
# O puedes usar el siguiente recurso de validación automática:

# Certificate Validation (opcional, requiere Route53)
# resource "aws_acm_certificate_validation" "main" {
#   count = var.enable_https && var.domain_name != "" ? 1 : 0
#   
#   certificate_arn         = aws_acm_certificate.main[0].arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
# }

# Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "api_target_group_arn" {
  description = "API Target Group ARN"
  value       = aws_lb_target_group.api.arn
}

output "web_target_group_arn" {
  description = "Web Target Group ARN"
  value       = aws_lb_target_group.web.arn
}
