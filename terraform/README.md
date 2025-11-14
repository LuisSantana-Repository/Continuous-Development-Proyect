# Terraform - Configuración Simple

Esta configuración de Terraform despliega 2 instancias EC2 t2.micro:

## Recursos
- **EC2 API**: Servidor para la API backend (puerto 3000)
- **EC2 Stamin-Up**: Servidor para el frontend (puerto 80)

## Configuración

### 1. Requisitos previos
- Terraform instalado
- AWS CLI configurado con credenciales
- Un key pair creado en AWS EC2

### 2. Configurar variables

Edita `terraform.tfvars` y cambia:
- `key_name`: El nombre de tu key pair en AWS
- Las variables de entorno según tus necesidades

### 3. Desplegar

```bash
# Inicializar Terraform
terraform init

# Ver el plan
terraform plan

# Aplicar cambios
terraform apply
```

### 4. Obtener las IPs

Después del despliegue, verás:
- IP pública de la API
- IP pública de Stamin-Up
- URLs de acceso

### 5. Conectarse por SSH

```bash
ssh -i /path/to/your-key.pem ubuntu@<IP_PUBLICA>
```

### 6. Destruir recursos

```bash
terraform destroy
```

## Variables de Entorno

Todas las variables están configuradas con valores placeholder (`lorem_ipsum` o `0.0.0.0`).

**Debes actualizarlas en `terraform.tfvars` antes de desplegar.**

## Costos

- 2 x t2.micro: ~$16.70/mes (si no estás en capa gratuita)
- Almacenamiento EBS: ~$1.60/mes (2 x 8GB)
- **Total estimado**: ~$18.30/mes
