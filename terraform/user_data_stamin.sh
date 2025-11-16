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

# Crear archivo .env desde Terraform variables (para variables de runtime)
echo "Creating .env file..."
cat > .env << 'EOF'
%{ for key, value in env_vars ~}
${key}=${value}
%{ endfor ~}
EOF

# Extraer NEXT_PUBLIC_API_URL del archivo .env para usarla en build time
NEXT_PUBLIC_API_URL=$(grep -E '^NEXT_PUBLIC_API_URL=' .env | cut -d '=' -f2)

# Build Docker image pasando NEXT_PUBLIC_API_URL como build argument
echo "Building Docker image with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}..."
sudo docker build \
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
  -t stamin-up-server .

# Run container con el resto de las variables de entorno
sudo docker run \
  --name stamin-up-server \
  --env-file .env \
  --restart=always \
  -d \
  -p 3001:3001 \
  stamin-up-server:latest

echo "Ubuntu WEB server setup complete!"
