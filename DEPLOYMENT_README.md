# ECR Deployment Guide - Optimized Web Build

Este proyecto usa **AWS ECR (Elastic Container Registry)** para pre-compilar la imagen Docker de **Web (Next.js)** solamente, reduciendo dramáticamente el tiempo de despliegue y uso de almacenamiento.

**Nota:** La API continúa compilándose directamente en las instancias EC2 (proceso tradicional).

## 🎯 Beneficios (Solo para Web)

| Antes (Compilar en EC2) | Después (Usando ECR) |
|-------------------------|-------------------|
| **Tiempo Build**: 5-10 minutos | **Tiempo Deploy**: 30-60 segundos |
| **Almacenamiento**: ~7GB por instancia | **Almacenamiento**: ~2-3GB por instancia |
| **Auto-Scaling**: Lento (compila en cada nueva instancia) | **Auto-Scaling**: Rápido (solo descarga imagen) |

## 🚀 Inicio Rápido

### Paso 1: Aplicar Infraestructura Terraform

Esto crea el repositorio ECR para Web y actualiza la configuración EC2:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Paso 2: Compilar y Subir Imagen Web a ECR

**En Windows (PowerShell):**
```powershell
.\scripts\build-and-push.ps1
```

**En Linux/Mac (Bash):**
```bash
./scripts/build-and-push.sh
```

**Esto hace:**
1. Compila imagen Docker optimizada de Next.js (multi-stage)
2. Inicia sesión en tu repositorio ECR
3. Etiqueta la imagen con `latest` y timestamp
4. Sube la imagen a AWS ECR

### Paso 3: Desplegar Instancias EC2

Las nuevas instancias Web ahora:
1. Descargan la imagen pre-compilada de ECR (~30 segundos)
2. Obtienen variables de entorno de Terraform
3. Inician el contenedor inmediatamente

Para actualizar instancias existentes:
```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name continuous-development-web-asg \
  --region us-east-1
```

## 📦 Cambios Implementados

### 1. Dockerfile Multi-Stage para Web

**Antes** (`stamin-up/Dockerfile`):
- Una sola etapa
- Todo incluido en la imagen final
- ~800MB de tamaño

**Después** (`stamin-up/Dockerfile`):
- 3 etapas: deps → builder → runner
- Solo dependencias de producción
- Usa Next.js standalone output
- ~200MB de tamaño (**4x más pequeño!**)
- Ejecuta como usuario no-root (más seguro)

### 2. Variables de Entorno

Las variables se pasan directamente desde Terraform a través de `user_data`:

**En `terraform.tfvars`:**
```hcl
stamin_env_vars = {
  NODE_ENV              = "production"
  NEXT_PUBLIC_APP_NAME  = "Stamin-Up"
  # Agrega más variables aquí
}
```

Variables automáticas (no necesitas definirlas):
- `NEXT_PUBLIC_URL` - URL pública del ALB
- `API_URL` - URL del API (http://alb-dns/api)

### 3. Script user_data Actualizado

**Antes**:
```bash
git clone → npm install → docker build → docker run
```

**Después** (solo Web):
```bash
fetch env vars → ECR login → docker pull → docker run
```

Ver: [`terraform/user_data_stamin.sh`](./terraform/user_data_stamin.sh)

La API sigue el proceso tradicional (no cambió).

## 🔄 Flujo de Desarrollo

### Cuando Haces Cambios al Código

#### Para Web (Next.js):

1. **Haz tus cambios** en `stamin-up/`
2. **Compila y sube**:
   ```powershell
   # Windows
   .\scripts\build-and-push.ps1
   ```
   ```bash
   # Linux/Mac
   ./scripts/build-and-push.sh
   ```
3. **Reinicia contenedores** en EC2:
   ```bash
   # SSH a la instancia
   ssh -i terraform/aws-ec2 ubuntu@<instance-ip>

   # Descarga y reinicia con última imagen
   sudo docker pull <ecr-url>:latest
   sudo docker restart web-server
   ```

#### Para API:

La API se compila directamente en EC2 (sin cambios):
- Los cambios requieren `terraform apply` o re-deploy de instancias
- No usa ECR

### Actualizar Variables de Entorno

**Para Web:**

Edita `terraform/terraform.tfvars`:
```hcl
stamin_env_vars = {
  NODE_ENV              = "production"
  NEXT_PUBLIC_API_URL   = "http://nuevo-valor.com"
  # etc...
}
```

Luego aplica:
```bash
cd terraform
terraform apply
```

Reinicia las instancias Web para aplicar cambios.

**Para API:**

Edita `terraform/terraform.tfvars`:
```hcl
api_env_vars = {
  NODE_ENV   = "production"
  JWT_SECRET = "tu-secreto"
  # etc...
}
```

Luego aplica:
```bash
cd terraform
terraform apply
```

## 📊 Monitoreo

### Ver Imágenes ECR

```bash
# Listar imágenes Web
aws ecr list-images \
  --repository-name continuous-development/web \
  --region us-east-1
```

### Verificar Estado de Despliegue

```bash
# Ver Auto Scaling Group status
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names continuous-development-web-asg \
  --region us-east-1

# Ver instancias ejecutándose
aws ec2 describe-instances \
  --filters "Name=tag:Service,Values=stamin-up" \
  --region us-east-1 \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
  --output table
```

### SSH y Verificar Logs

```bash
# SSH a la instancia
ssh -i terraform/aws-ec2 ubuntu@<instance-ip>

# Ver logs de user_data
sudo cat /var/log/cloud-init-output.log

# Ver logs del contenedor
sudo docker logs web-server

# Ver contenedores corriendo
sudo docker ps
```

## 🔧 Solución de Problemas

### No puedo subir a ECR

**Problema**: `denied: User is not authorized`

**Solución**:
1. Verifica credenciales AWS: `aws sts get-caller-identity`
2. Asegúrate que el repositorio ECR existe: `terraform apply`
3. Re-inicia sesión: Ejecuta el script build-and-push nuevamente

### La instancia EC2 no puede descargar de ECR

**Problema**: La instancia falla al descargar imagen

**Solución**:
1. Verifica que el rol IAM tiene permisos ECR (ya configurado en `terraform/modules/iam/main.tf`)
2. SSH y verifica logs: `sudo cat /var/log/cloud-init-output.log`
3. Prueba manualmente:
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   ```

### Script PowerShell falla en Windows

**Problema**: Error de ejecución de scripts

**Solución**:
```powershell
# Permite ejecución de scripts (una vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Luego ejecuta
.\scripts\build-and-push.ps1
```

## 💰 Costos

### ECR Storage

- **Costo**: $0.10 por GB-mes
- **Política de ciclo de vida**: Elimina automáticamente imágenes antiguas (mantiene últimas 5)
- **Costo típico**: $0.02-0.05/mes

### Optimización de Volúmenes EBS

Ahora puedes usar volúmenes más pequeños para Web:
- **Antes**: 20GB recomendado
- **Después**: 8GB suficiente
- **Ahorro**: ~$0.80/mes por instancia Web

## 🔐 Mejoras de Seguridad

1. ✅ **Multi-stage builds** reducen superficie de ataque
2. ✅ **Usuario no-root** en contenedores
3. ✅ **Roles IAM** en lugar de credenciales hardcodeadas
4. ✅ **Health checks** en Dockerfiles

## 📁 Archivos Importantes

- **Scripts de Build**:
  - [`scripts/build-and-push.ps1`](./scripts/build-and-push.ps1) - PowerShell para Windows
  - [`scripts/build-and-push.sh`](./scripts/build-and-push.sh) - Bash para Linux/Mac

- **Dockerfiles**:
  - [`stamin-up/Dockerfile`](./stamin-up/Dockerfile) - Multi-stage Web (optimizado con ECR)
  - [`api/Dockerfile`](./api/Dockerfile) - API tradicional (sin cambios)

- **Terraform**:
  - [`terraform/modules/ecr/main.tf`](./terraform/modules/ecr/main.tf) - Repositorio ECR
  - [`terraform/user_data_stamin.sh`](./terraform/user_data_stamin.sh) - Script de inicio Web
  - [`terraform/user_data_api.sh`](./terraform/user_data_api.sh) - Script de inicio API (sin cambios)

- **Configuración**:
  - [`stamin-up/.env.example`](./stamin-up/.env.example) - Ejemplo variables Web
  - [`terraform/terraform.tfvars.example`](./terraform/terraform.tfvars.example) - Ejemplo config Terraform

## 🆘 Necesitas Ayuda?

1. Revisa logs: `sudo cat /var/log/cloud-init-output.log`
2. Verifica consola AWS: ECR, EC2
3. Prueba localmente: `docker build -t test ./stamin-up`
4. Revisa documentación AWS

---

**Happy Deploying! 🚀**

*Optimización solo para Web - La API mantiene el proceso tradicional de build*
