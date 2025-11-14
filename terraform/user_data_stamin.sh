#!/bin/bash
set -e

# Actualizar el sistema
apt-get update
apt-get upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt-get install -y docker-compose-plugin

# Habilitar Docker
systemctl enable docker
systemctl start docker

# Crear directorio para la aplicación
mkdir -p /app
cd /app

# Crear archivo .env con las variables
cat > .env << EOF
%{for key, value in env_vars}
${key}=${value}
%{endfor}
EOF

# Crear docker-compose.yml para Stamin-Up
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  stamin-up:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./stamin-up:/app
    ports:
      - "80:3000"
    env_file:
      - .env
    command: sh -c "npm install && npm start"
    restart: unless-stopped

COMPOSE_EOF

# Nota: Aquí deberías clonar tu repositorio o copiar el código
# Por ahora dejamos preparado el entorno

echo "Stamin-Up server setup complete!"
