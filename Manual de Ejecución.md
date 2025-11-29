# Guía de Despliegue - Stamin-Up AWS Infrastructure

## Desarrollo Local

### Opción rápida con Docker Compose

Para desarrollo y pruebas locales:

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto levantará:
- **API**: `http://localhost:3000`
- **Frontend**: `http://localhost:3001`
- **Base de datos**: `localhost:3306`
- **Otros servicios** configurados en `docker-compose.yml`

### Verificar servicios locales
```bash
# Ver contenedores corriendo
docker-compose ps

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

---

## 1. Configurar AWS CLI

### Descargar e instalar AWS CLI
```bash
sudo apt-get install awscli
```

### Configurar credenciales
```bash
aws configure
```

Ingresa los siguientes datos:
```
AWS Access Key ID [None]: TU_ACCESS_KEY_ID
AWS Secret Access Key [None]: TU_SECRET_ACCESS_KEY
Default region name [None]: us-east-1
Default output format [None]: json
```

---

## 2. Crear repositorios ECR

```bash
cd terraform
terraform init
terraform apply -target=module.ecr
```

---

## 3. Construir y subir imágenes Docker a ECR

```bash
cd ../
bash ./scripts/build-and-push-to-ecr.sh
```

---

## 4. Desplegar infraestructura completa

```bash
cd terraform
terraform init
terraform apply
```

---

## 5. Obtener información de conexión EC2

Después del despliegue, obtén el DNS público de una instancia EC2:


## 6. Transferir scripts SQL a EC2

```bash
cd ../

# Transferir script de base de datos primaria
scp -i ./terraform/aws-ec2 ./DB_Backup/init-db-primary.sql ubuntu@<EC2-DNS>:~/

# Transferir script de base de datos secundaria
scp -i ./terraform/aws-ec2 ./DB_Backup/init-db-secondary.sql ubuntu@<EC2-DNS>:~/
```

> **Reemplaza `<EC2-DNS>`** con el DNS público de tu instancia, ejemplo:  
> `ec2-3-239-90-123.compute-1.amazonaws.com`

---

## 7. Conectar por SSH a la instancia EC2

```bash
ssh -i ./terraform/aws-ec2 ubuntu@<EC2-DNS>
```

---

## 8. Inicializar bases de datos RDS

### Instalar cliente MySQL
```bash
sudo apt-get install -y mysql-client
```

### Obtener endpoints de RDS
Ubicados en el output de terraform o en aws

### Importar datos a las bases de datos

Desde la sesión SSH:

```bash
# Base de datos primaria
mysql -h <RDS-hot-rds-endpoind> -u admin -p < init-db-primary.sql

# Base de datos secundaria (si está habilitada)
mysql -h <RDS-cold-rds-endpoind> -u admin -p < init-db-secondary.sql
```

**Password:** `3deAsada.`

> **Ejemplo de endpoint:**  
> `stamin-up-primary-db.abc123xyz.us-east-1.rds.amazonaws.com`

---

## 9. Verificar conexión a base de datos

```bash
# Conectar a la base de datos primaria
mysql -h  -u admin -p

# Dentro de MySQL
SHOW DATABASES;
USE my_sql_rds_hot;
SHOW TABLES;
EXIT;
```

---