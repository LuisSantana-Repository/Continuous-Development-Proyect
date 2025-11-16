# Build and Push Web Docker Image to ECR (PowerShell para Windows)
# Este script compila la imagen Docker de Web (Next.js) y la sube a AWS ECR
# API continúa compilándose en las instancias EC2
# Uso: .\scripts\build-and-push.ps1

# Configuración
$ErrorActionPreference = "Stop"
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$PROJECT_NAME = if ($env:PROJECT_NAME) { $env:PROJECT_NAME } else { "continuous-development" }

Write-Host "==================================" -ForegroundColor Green
Write-Host "Docker Build and Push to ECR" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Verificar que Docker está instalado
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker no está ejecutándose" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar que AWS CLI está instalado
try {
    aws --version | Out-Null
} catch {
    Write-Host "Error: AWS CLI no está instalado" -ForegroundColor Red
    Write-Host "Instálalo desde: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Obtener AWS Account ID
Write-Host "Obteniendo AWS Account ID..." -ForegroundColor Yellow
try {
    $AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
} catch {
    Write-Host "Error: No se pudo obtener AWS Account ID. Verifica tus credenciales AWS." -ForegroundColor Red
    exit 1
}

Write-Host "AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Green
Write-Host "AWS Region: $AWS_REGION" -ForegroundColor Green
Write-Host ""

# Login a ECR
Write-Host "Iniciando sesión en ECR..." -ForegroundColor Yellow
try {
    $ECR_LOGIN = aws ecr get-login-password --region $AWS_REGION
    $ECR_LOGIN | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com" 2>&1 | Out-Null
    Write-Host "Sesión iniciada correctamente en ECR" -ForegroundColor Green
} catch {
    Write-Host "Error: Fallo al iniciar sesión en ECR" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Construir y subir Web
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "Construyendo Imagen Web" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow

# Navegar al directorio de stamin-up
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$WEB_DIR = Join-Path (Split-Path -Parent $SCRIPT_DIR) "stamin-up"

if (-not (Test-Path $WEB_DIR)) {
    Write-Host "Error: No se encontró el directorio stamin-up" -ForegroundColor Red
    exit 1
}

Set-Location $WEB_DIR

$ECR_REPO_URL = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/web"

Write-Host "Construyendo imagen Docker para Web (Next.js)..." -ForegroundColor Yellow
try {
    docker build -t "$PROJECT_NAME/web:latest" .
    Write-Host "Imagen Web construida exitosamente" -ForegroundColor Green
} catch {
    Write-Host "Error: Fallo la construcción de Docker para Web" -ForegroundColor Red
    exit 1
}

# Etiquetar para ECR
Write-Host "Etiquetando imagen para ECR..." -ForegroundColor Yellow
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
docker tag "$PROJECT_NAME/web:latest" "$ECR_REPO_URL:latest"
docker tag "$PROJECT_NAME/web:latest" "$ECR_REPO_URL:$TIMESTAMP"

# Subir a ECR
Write-Host "Subiendo a ECR..." -ForegroundColor Yellow
try {
    docker push "$ECR_REPO_URL:latest"
    docker push "$ECR_REPO_URL:$TIMESTAMP"
    Write-Host "✓ Imagen Web subida exitosamente a ECR" -ForegroundColor Green
    Write-Host "  Repositorio: $ECR_REPO_URL" -ForegroundColor Green
} catch {
    Write-Host "Error: Fallo al subir imagen Web" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Build and Push Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Aplicar cambios de Terraform: cd terraform && terraform apply" -ForegroundColor White
Write-Host "2. Las instancias Web automáticamente descargarán esta imagen" -ForegroundColor White
Write-Host "3. API continúa compilándose en instancias EC2 (no necesita ECR)" -ForegroundColor White
Write-Host "4. Monitorear despliegue: aws ec2 describe-instances --region $AWS_REGION" -ForegroundColor White
Write-Host ""
