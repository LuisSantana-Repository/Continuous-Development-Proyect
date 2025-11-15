#!/bin/bash
set -e

# Actualizar sistema
apt-get update
apt-get upgrade -y

# Instalar dependencias
apt-get install -y git curl ca-certificates gnupg lsb-release

# Instalar Docker (método oficial)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose plugin
apt-get install -y docker-compose-plugin

# Habilitar Docker
systemctl enable docker
systemctl start docker

# Crear carpeta de la app
mkdir -p /app
cd /app

# Clonar tu repo
git clone https://github.com/LuisSantana-Repository/Continuous-Development-Proyect.git .

cd ./stamin-up

# Crear archivo .env con las variables de entorno desde Terraform
cat > .env << EOF
%{ for key, value in env_vars ~}
${key}=${value}
%{ endfor ~}
EOF

#start the application using DOCKERFILE
sudo docker build -t stamin-up .
sudo docker run -d -p 3001:3001 stamin-up:latest


echo "Ubuntu API server setup complete!"
