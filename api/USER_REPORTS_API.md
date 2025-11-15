# User Reports API

API endpoints para que los clientes reporten problemas con proveedores/servicios.

## Base URL

`/user-reports`

## Endpoints

### 1. Crear Reporte de Usuario

**POST** `/user-reports`

Permite a un cliente crear un reporte sobre un proveedor/servicio.

**Autenticación:** Requerida

**Body:**

```json
{
  "serviceRequestId": "uuid-de-la-solicitud",
  "reportMessage": "El proveedor no se presentó a la cita acordada y no respondió mis mensajes..."
}
```

**Validaciones:**

- `serviceRequestId`: String UUID, requerido, debe existir y pertenecer al usuario autenticado
- `reportMessage`: String, requerido, mínimo 20 caracteres, máximo 2000 caracteres

**Response (201):**

```json
{
  "success": true,
  "data": {
    "reportId": "uuid-del-reporte"
  }
}
```

**Errores:**

- `400`: Validación fallida
- `404`: Solicitud de servicio no encontrada o no pertenece al usuario
- `409`: Ya existe un reporte para esta solicitud de servicio
- `500`: Error interno del servidor

---

### 2. Obtener Reporte por ID

**GET** `/user-reports/:reportId`

Obtiene un reporte específico por su ID.

**Autenticación:** Requerida

**Response (200):**

```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "user_id": "uuid-del-cliente",
    "service_request_id": "uuid-de-la-solicitud",
    "report_message": "El proveedor no se presentó...",
    "status": "pending",
    "created_at": "2025-11-14T10:00:00.000Z",
    "updated_at": "2025-11-14T10:00:00.000Z",
    "provider_id": 123,
    "provider_workname": "Plomería Express",
    "provider_username": "Juan Pérez"
  }
}
```

**Errores:**

- `404`: Reporte no encontrado
- `500`: Error interno del servidor

---

### 3. Obtener Reportes Creados por un Usuario

**GET** `/user-reports/user/:userId`

Obtiene todos los reportes que un usuario ha creado.

**Autenticación:** Requerida (solo puede ver sus propios reportes)

**Query Parameters:**

- `page`: Número de página (default: 1)
- `pageSize`: Elementos por página (default: 10)
- `status`: Filtrar por estado (opcional: pending, reviewing, resolved, rejected)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "report_id": "uuid",
      "user_id": "uuid-del-cliente",
      "service_request_id": "uuid",
      "report_message": "El proveedor no se presentó...",
      "status": "pending",
      "created_at": "2025-11-14T10:00:00.000Z",
      "updated_at": "2025-11-14T10:00:00.000Z",
      "provider_id": 123,
      "provider_workname": "Plomería Express",
      "provider_username": "Juan Pérez",
      "service_type": "Plumbing"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Errores:**

- `400`: Parámetros inválidos
- `403`: No autorizado para ver reportes de otro usuario
- `500`: Error interno del servidor

---

### 4. Obtener Reportes sobre un Proveedor

**GET** `/user-reports/provider/:providerId`

Obtiene todos los reportes que se han hecho sobre un proveedor específico.

**Autenticación:** Requerida (debe ser el proveedor o admin)

**Query Parameters:**

- `page`: Número de página (default: 1)
- `pageSize`: Elementos por página (default: 10)
- `status`: Filtrar por estado (opcional: pending, reviewing, resolved, rejected)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "report_id": "uuid",
      "user_id": "uuid-del-cliente",
      "service_request_id": "uuid",
      "report_message": "El proveedor no se presentó...",
      "status": "resolved",
      "created_at": "2025-11-14T10:00:00.000Z",
      "updated_at": "2025-11-14T12:00:00.000Z",
      "username": "María González",
      "user_photo": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Errores:**

- `400`: Provider ID inválido o parámetros inválidos
- `500`: Error interno del servidor

---

### 5. Obtener Estadísticas de Reportes de un Proveedor

**GET** `/user-reports/provider/:providerId/stats`

Obtiene estadísticas de reportes de un proveedor.

**Autenticación:** Requerida

**Response (200):**

```json
{
  "success": true,
  "data": {
    "providerId": 123,
    "totalReports": 10,
    "pendingReports": 2,
    "reviewingReports": 3,
    "resolvedReports": 4,
    "rejectedReports": 1
  }
}
```

**Errores:**

- `400`: Provider ID inválido
- `500`: Error interno del servidor

---

### 6. Actualizar Estado del Reporte

**PATCH** `/user-reports/:reportId`

Actualiza el estado de un reporte (función de administrador/moderador).

**Autenticación:** Requerida (debe ser admin/moderador)

**Body:**

```json
{
  "status": "resolved"
}
```

**Validaciones:**

- `status`: String, requerido, debe ser uno de: pending, reviewing, resolved, rejected

**Response (200):**

```json
{
  "success": true,
  "message": "report status updated successfully"
}
```

**Errores:**

- `400`: Validación fallida o no hay campos para actualizar
- `404`: Reporte no encontrado
- `500`: Error interno del servidor

---

### 7. Eliminar Reporte

**DELETE** `/user-reports/:reportId`

Elimina un reporte.

**Autenticación:** Requerida (debe ser el creador del reporte o admin)

**Response (200):**

```json
{
  "success": true,
  "message": "report deleted successfully"
}
```

**Errores:**

- `403`: No autorizado para eliminar este reporte
- `404`: Reporte no encontrado
- `500`: Error interno del servidor

---

## Estructura de la Tabla

```sql
CREATE TABLE IF NOT EXISTS `user_reports` (
  `report_id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `service_request_id` VARCHAR(36) NOT NULL,
  `report_message` TEXT NOT NULL,
  `status` ENUM('pending', 'reviewing', 'resolved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(request_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_report_per_request (user_id, service_request_id),
  INDEX idx_user_id (user_id),
  INDEX idx_service_request_id (service_request_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Estados del Reporte

1. **`pending`**: Reporte recién creado, esperando revisión
2. **`reviewing`**: Reporte en proceso de investigación por moderadores
3. **`resolved`**: Reporte resuelto, acción tomada
4. **`rejected`**: Reporte rechazado por no ser válido

## Casos de Uso

1. **Cliente insatisfecho**: Reportar servicio de mala calidad
2. **Proveedor no se presentó**: Reportar ausencia del proveedor
3. **Comportamiento inapropiado**: Reportar conducta no profesional
4. **Fraude o estafa**: Reportar actividades fraudulentas
5. **Violación de términos**: Reportar violación de políticas de la plataforma

## Flujo de Trabajo

1. **Cliente crea reporte** → Estado: `pending`
2. **Moderador revisa** → Estado: `reviewing`
3. **Se toma acción**:
   - ✅ Problema verificado → Estado: `resolved` (se puede sancionar al proveedor)
   - ❌ Reporte no válido → Estado: `rejected`

## Notas de Implementación

- Un cliente solo puede reportar una vez por solicitud de servicio
- El reporte debe estar vinculado a una solicitud real (verificación de interacción)
- Mensaje mínimo de 20 caracteres para evitar reportes vacíos o spam
- Las estadísticas ayudan a identificar proveedores problemáticos
- TODO: Implementar roles de admin/moderador para gestión de reportes
- TODO: Considerar sistema de notificaciones cuando un reporte es resuelto
