# Provider Reviews API

API endpoints para que los proveedores califiquen a los clientes después de completar un servicio.

## Base URL

`/provider-reviews`

## Endpoints

### 1. Crear Review de Proveedor

**POST** `/provider-reviews`

Permite a un proveedor crear una reseña sobre un cliente.

**Autenticación:** Requerida

**Body:**

```json
{
  "providerId": 123,
  "userId": "uuid-del-cliente",
  "serviceRequestId": "uuid-de-la-solicitud", // Opcional
  "rating": 5,
  "comment": "Excelente cliente, muy puntual y respetuoso" // Opcional
}
```

**Validaciones:**

- `providerId`: Número, requerido, debe existir en la tabla `providers`
- `userId`: String UUID, requerido, debe existir en la tabla `users`
- `serviceRequestId`: String UUID, opcional, si se proporciona debe pertenecer al provider y user especificados
- `rating`: Entero entre 1 y 5, requerido
- `comment`: String, opcional, mínimo 10 caracteres si se proporciona, máximo 1000 caracteres

**Response (201):**

```json
{
  "success": true,
  "data": {
    "reviewId": "uuid-de-la-review"
  }
}
```

**Errores:**

- `400`: Validación fallida
- `404`: Usuario o solicitud de servicio no encontrada
- `409`: Ya existe una review para esta solicitud de servicio
- `500`: Error interno del servidor

---

### 2. Obtener Review por ID

**GET** `/provider-reviews/:reviewId`

Obtiene una reseña específica por su ID.

**Autenticación:** Requerida

**Response (200):**

```json
{
  "success": true,
  "data": {
    "review_id": "uuid",
    "provider_id": 123,
    "user_id": "uuid-del-cliente",
    "service_request_id": "uuid-de-la-solicitud",
    "rating": 5,
    "comment": "Excelente cliente...",
    "created_at": "2025-11-14T10:00:00.000Z",
    "updated_at": "2025-11-14T10:00:00.000Z"
  }
}
```

**Errores:**

- `404`: Review no encontrada
- `500`: Error interno del servidor

---

### 3. Obtener Reviews Recibidas por un Cliente

**GET** `/provider-reviews/user/:userId`

Obtiene todas las reseñas que un cliente ha recibido de proveedores.

**Autenticación:** No requerida (endpoint público)

**Query Parameters:**

- `page`: Número de página (default: 1)
- `pageSize`: Elementos por página (default: 10)
- `minRating`: Rating mínimo para filtrar (opcional, 1-5)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "review_id": "uuid",
      "provider_id": 123,
      "user_id": "uuid-del-cliente",
      "service_request_id": "uuid",
      "rating": 5,
      "comment": "Excelente cliente...",
      "created_at": "2025-11-14T10:00:00.000Z",
      "updated_at": "2025-11-14T10:00:00.000Z",
      "provider_workname": "Plomería Express",
      "provider_username": "Juan Pérez",
      "provider_photo": "https://...",
      "service_type": "Plumbing"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Errores:**

- `400`: Parámetros inválidos
- `500`: Error interno del servidor

---

### 4. Obtener Reviews Creadas por un Proveedor

**GET** `/provider-reviews/provider/:providerId`

Obtiene todas las reseñas que un proveedor ha creado sobre sus clientes.

**Autenticación:** Requerida

**Query Parameters:**

- `page`: Número de página (default: 1)
- `pageSize`: Elementos por página (default: 10)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "review_id": "uuid",
      "provider_id": 123,
      "user_id": "uuid-del-cliente",
      "service_request_id": "uuid",
      "rating": 5,
      "comment": "Excelente cliente...",
      "created_at": "2025-11-14T10:00:00.000Z",
      "updated_at": "2025-11-14T10:00:00.000Z",
      "username": "María González",
      "user_photo": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 15,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Errores:**

- `400`: Provider ID inválido
- `500`: Error interno del servidor

---

### 5. Obtener Rating Promedio de un Cliente

**GET** `/provider-reviews/user/:userId/rating`

Obtiene el rating promedio y total de reviews de un cliente.

**Autenticación:** No requerida (endpoint público)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "uuid-del-cliente",
    "averageRating": 4.75,
    "totalReviews": 8
  }
}
```

**Errores:**

- `500`: Error interno del servidor

---

### 6. Actualizar Review

**PATCH** `/provider-reviews/:reviewId`

Actualiza una reseña existente.

**Autenticación:** Requerida (debe ser el proveedor que creó la review)

**Body:**

```json
{
  "rating": 4,
  "comment": "Cliente puntual y respetuoso"
}
```

**Validaciones:**

- Al menos un campo debe ser proporcionado
- `rating`: Entero entre 1 y 5, opcional
- `comment`: String, opcional, mínimo 10 caracteres si se proporciona, máximo 1000 caracteres

**Response (200):**

```json
{
  "success": true,
  "message": "provider review updated successfully"
}
```

**Errores:**

- `400`: Validación fallida o no hay campos para actualizar
- `404`: Review no encontrada
- `500`: Error interno del servidor

---

### 7. Eliminar Review

**DELETE** `/provider-reviews/:reviewId`

Elimina una reseña.

**Autenticación:** Requerida (debe ser el proveedor que creó la review)

**Response (200):**

```json
{
  "success": true,
  "message": "provider review deleted successfully"
}
```

**Errores:**

- `404`: Review no encontrada
- `500`: Error interno del servidor

---

## Estructura de la Tabla

```sql
CREATE TABLE IF NOT EXISTS `provider_reviews` (
  `review_id` VARCHAR(36) PRIMARY KEY,
  `provider_id` INT NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `service_request_id` VARCHAR(36),
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(request_id) ON DELETE SET NULL,
  UNIQUE KEY unique_provider_review_per_request (provider_id, service_request_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Diferencias con User Reviews

### `user_reviews` (Clientes → Proveedores)

- Los **clientes** califican a los **proveedores**
- Endpoint: `/reviews`
- Tabla: `user_reviews`
- Constraint único: `(user_id, service_request_id)`

### `provider_reviews` (Proveedores → Clientes)

- Los **proveedores** califican a los **clientes**
- Endpoint: `/provider-reviews`
- Tabla: `provider_reviews`
- Constraint único: `(provider_id, service_request_id)`

## Casos de Uso

1. **Después de completar un servicio**, el proveedor puede calificar al cliente
2. **Clientes con buen rating** pueden ser más atractivos para proveedores
3. **Sistema de reputación bidireccional**: tanto clientes como proveedores tienen ratings
4. **Filtrado de clientes**: proveedores pueden ver el historial de un cliente antes de aceptar un trabajo

## Notas de Implementación

- Ambas reviews (user y provider) están vinculadas a `service_request_id`
- Un proveedor solo puede dejar una review por solicitud de servicio
- Las reviews son opcionales pero recomendadas para construir confianza
- El sistema de rating es de 1 a 5 estrellas (enteros)
- Los comentarios son opcionales pero recomendados
