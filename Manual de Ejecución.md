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

## 10. Flujo sugerido para probar el sistema

Este flujo describe cómo un usuario final probaría todas las funcionalidades de la aplicación web **Stamin-Up**.

### 10.1. Acceso Inicial

1. Abrir el navegador y acceder a:
   - **Local:** `http://localhost:3001`
   - **AWS:** `https://<ALB-DNS>`

2. Verificar que la página de inicio carga correctamente
   - Se muestra el landing page
   - Se visualizan los servicios destacados

---

### 10.2. Registro y Autenticación

**Registro de nuevo usuario:**
1. Click en "Registrarse" o "Sign Up"
2. Completar el formulario con:
   - Nombre de usuario
   - Email
   - Contraseña
   - Confirmar contraseña
3. Enviar el formulario
4. Verificar que se crea la cuenta exitosamente
5. Verificar redirección automática al perfil o dashboard

**Inicio de sesión:**
1. Click en "Iniciar Sesión" o "Login"
2. Ingresar credenciales:
   - Email
   - Contraseña
3. Click en "Entrar"
4. Verificar que se redirige al dashboard o home del usuario autenticado
5. Verificar que aparece el nombre del usuario en el header/navbar

**Cerrar sesión:**
1. Click en el menú de usuario
2. Seleccionar "Cerrar Sesión" o "Logout"
3. Verificar redirección a la página de inicio

---

### 10.3. Exploración de Servicios

1. **Página de servicios:**
   - Navegar a la sección de servicios
   - Verificar que se muestran los servicios disponibles
   - Probar filtros/búsqueda de servicios

2. **Detalle de servicio:**
   - Click en un servicio específico
   - Verificar que se muestra:
     - Nombre del servicio
     - Descripción
     - Precio
     - Proveedores que ofrecen el servicio
     - Imágenes relacionadas
     - Reseñas y calificaciones

3. **Solicitar servicio:**
   - Click en "Contratar"
   - Completar detalles de la solicitud:
     - Fecha/hora preferida
     - Ubicación
     - Notas adicionales
   - Enviar solicitud

---

### 10.5. Chat y Comunicación

1. **Iniciar chat con proveedor:**
   - Desde Mi perfil, click en "Chatear" o "Mensajes"
   - Verificar que se abre la interfaz de chat

2. **Enviar mensajes:**
   - Escribir y enviar un mensaje
   - Verificar que el mensaje se envía correctamente
   - Verificar que aparece en el historial de chat
   - Probar envío de mensajes en tiempo real 

---

### 10.6. Gestión de Reseñas

1. **Dejar una reseña:**
   - Después de completar un servicio, navegar al perfil del proveedor
   - Click en "Dejar reseña" o "Escribir opinión"
   - Completar:
     - Calificación (estrellas)
     - Comentario escrito
   - Enviar reseña

2. **Ver reseñas:**
   - Navegar a la sección de reseñas del proveedor
   - Verificar que se muestran todas las reseñas

---

### 10.7. Perfil de Usuario

1. **Acceder al perfil:**
   - Click en el avatar o nombre de usuario
   - Seleccionar "Mi Perfil" o "Profile"

2. **Editar información:**
   - Actualizar datos personales
   - Cambiar foto de perfil
   - Guardar cambios

3. **Historial:**
   - Ver historial de servicios contratados
---


### 10.8. Reportes y Moderación

1. **Reportar proveedor:**
   - Desde Mi perfil, buscar opción de "Reportar"
   - Agregar descripción
   - Enviar reporte

2. **Reportar usuario:**
   - Similar proceso al de reportar provedor pero en una seccion de provedor
   - Verificar confirmación de envío