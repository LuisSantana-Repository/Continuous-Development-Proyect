#!/bin/bash
# terraform/user_data_web.sh
set -e

# Log todas las operaciones
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "====================================="
echo "Iniciando configuración Web Server"
echo "====================================="

# Actualizar sistema
echo "Actualizando sistema..."
yum update -y

# Instalar Node.js 18
echo "Instalando Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Verificar instalación de Node
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Instalar Git
echo "Instalando Git..."
yum install -y git

# Instalar Docker (opcional, por si necesitas construir imágenes)
# echo "Instalando Docker..."
# yum install -y docker
# systemctl start docker
# systemctl enable docker
# usermod -aG docker ec2-user

# Instalar CloudWatch Agent
echo "Instalando CloudWatch Agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Obtener metadata de la instancia
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

echo "Instance ID: $INSTANCE_ID"
echo "Region: $REGION"

# Crear directorio de la aplicación
echo "Creando directorio de aplicación..."
mkdir -p /app
cd /app

# Clonar el repositorio (NEXT.JS APP)
echo "Clonando repositorio desde GitHub..."
git clone https://github.com/LuisSantana-Repository/Continuous-Development-Proyect.git /app/web
cd /app/web

# Ir al directorio de la aplicación Next.js
# (ajustar si tu Next.js está en un subdirectorio específico)
if [ -d "stamin-up" ]; then
    echo "Navegando a directorio stamin-up..."
    cd stamin-up
    WORKDIR="/app/web/stamin-up"
else
    echo "Usando directorio raíz como aplicación Next.js..."
    WORKDIR="/app/web"
fi

# Crear archivo .env.production
echo "Creando archivo .env.production..."
cat > .env.production << EOF
NODE_ENV=production
PORT=3001

# API URLs
NEXT_PUBLIC_API_URL=${api_url}
API_URL=${api_url}

# Next.js config
NEXT_TELEMETRY_DISABLED=1

# Instance metadata
INSTANCE_ID=$INSTANCE_ID
REGION=$REGION
EOF

# Instalar dependencias de producción
echo "Instalando dependencias..."
npm ci --production=false

# Build de la aplicación Next.js
echo "Building aplicación Next.js..."
npm run build

# Limpiar dev dependencies después del build
echo "Limpiando dev dependencies..."
npm prune --production

# Cambiar ownership a ec2-user
echo "Cambiando ownership a ec2-user..."
chown -R ec2-user:ec2-user /app

# Crear systemd service
echo "Creando servicio systemd..."
cat > /etc/systemd/system/web.service << EOF
[Unit]
Description=Stamin-Up Web Server (Next.js)
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=$WORKDIR
Environment=NODE_ENV=production
Environment=PORT=3001
EnvironmentFile=$WORKDIR/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=stamin-up-web

# Límites de recursos
LimitNOFILE=65536
MemoryLimit=1G

[Install]
WantedBy=multi-user.target
EOF

# Configurar CloudWatch Logs
echo "Configurando CloudWatch Agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/stamin-up/web",
            "log_stream_name": "$INSTANCE_ID-user-data",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/stamin-up/web",
            "log_stream_name": "$INSTANCE_ID-system",
            "timezone": "UTC"
          }
        ]
      },
      "journal": {
        "log_stream_name": "$INSTANCE_ID-journal",
        "unit_whitelist": ["web.service"]
      }
    },
    "log_stream_name": "$INSTANCE_ID"
  },
  "metrics": {
    "namespace": "StaminUp/EC2/Web",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          },
          {
            "name": "cpu_usage_active",
            "rename": "CPU_ACTIVE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          },
          {
            "name": "free",
            "rename": "DISK_FREE",
            "unit": "Gigabytes"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          },
          {
            "name": "mem_available",
            "rename": "MEM_AVAILABLE",
            "unit": "Megabytes"
          }
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          {
            "name": "tcp_established",
            "rename": "TCP_ESTABLISHED",
            "unit": "Count"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Iniciar CloudWatch Agent
echo "Iniciando CloudWatch Agent..."
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Habilitar e iniciar el servicio
echo "Habilitando y iniciando servicio web..."
systemctl daemon-reload
systemctl enable web.service
systemctl start web.service

# Esperar unos segundos para que el servicio inicie
sleep 5

# Verificar estado del servicio
echo "Estado del servicio:"
systemctl status web.service --no-pager || true

# Verificar que la aplicación responde
echo "Verificando que la aplicación responde..."
sleep 10
curl -I http://localhost:3001 || echo "WARNING: La aplicación aún no responde (puede tardar unos minutos)"

# Log de finalización
echo "====================================="
echo "Web instance initialization complete"
echo "Instance ID: $INSTANCE_ID"
echo "Region: $REGION"
echo "Working Directory: $WORKDIR"
echo "Service Status: $(systemctl is-active web.service)"
echo "====================================="

# Información útil para debugging
echo ""
echo "COMANDOS ÚTILES PARA DEBUGGING:"
echo "  - Ver logs del servicio: journalctl -u web.service -f"
echo "  - Ver logs de user-data: tail -f /var/log/user-data.log"
echo "  - Ver logs de CloudWatch: tail -f /var/log/amazon/amazon-cloudwatch-agent/amazon-cloudwatch-agent.log"
echo "  - Reiniciar servicio: systemctl restart web.service"
echo "  - Ver variables de entorno: systemctl show web.service --property=Environment"
echo ""
