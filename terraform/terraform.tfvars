# Configuración básica
aws_region   = "us-east-1"
project_name = "stamin-up"
instance_type = "t2.micro"

# IMPORTANTE: Cambia este valor por el nombre de tu key pair en AWS
key_name = "lorem_ipsum"

# Variables de entorno para la API
api_env_vars = {
  PORT        = "3000"
  NODE_ENV    = "production"
  DB_HOST     = "lorem_ipsum"
  DB_PORT     = "5432"
  DB_NAME     = "lorem_ipsum"
  DB_USER     = "lorem_ipsum"
  DB_PASSWORD = "lorem_ipsum"
  JWT_SECRET  = "lorem_ipsum"
  CORS_ORIGIN = "0.0.0.0"
  REDIS_HOST  = "0.0.0.0"
  REDIS_PORT  = "6379"
}

# Variables de entorno para Stamin-Up
stamin_env_vars = {
  REACT_APP_API_URL = "0.0.0.0"
  REACT_APP_ENV     = "production"
  REACT_APP_NAME    = "lorem_ipsum"
  REACT_APP_VERSION = "1.0.0"
}
