import { getPrimaryPool } from "../config/database.js";

export async function getServices(page = 1, pageSize = 10) {
  const db = await getPrimaryPool();
  // Asegurar que son números válidos
  const safePage = Math.max(1, parseInt(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 10)); // Max 100 items por página

  // Calcular offset basado en página
  const offset = (safePage - 1) * safePageSize;

  // Obtener total de registros
  const [countResult] = await db.execute(
    "SELECT COUNT(*) as total FROM ServiceType"
  );
  const total = countResult[0].total;

  console.log(
    `Fetching services - Page: ${safePage}, Page Size: ${safePageSize}, Offset: ${offset}, Total: ${total}`
  );
  // Obtener datos paginados - SOLUCIÓN: concatenar valores ya validados directamente
  const [rows] = await db.query(
    `SELECT id, type_name FROM ServiceType LIMIT ${safePageSize} OFFSET ${offset}`
  );

  return {
    data: rows,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total: total,
      totalPages: Math.ceil(total / safePageSize),
      hasNextPage: safePage < Math.ceil(total / safePageSize),
      hasPrevPage: safePage > 1,
    },
  };
}

export async function getProviderServices(page = 1, pageSize = 10) {
  const db = await getPrimaryPool();
  // Asegurar que son números válidos
  const safePage = Math.max(1, parseInt(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 10));

  // Calcular offset basado en página
  const offset = (safePage - 1) * safePageSize;

  // Obtener total de registros
  const [countResult] = await db.execute(
    "SELECT COUNT(*) as total FROM providers"
  );
  const total = countResult[0].total;

  console.log(
    `Fetching provider services - Page: ${safePage}, Page Size: ${safePageSize}, Offset: ${offset}, Total: ${total}`
  );

  // Obtener datos paginados con información del usuario y tipo de servicio
  // SOLUCIÓN: concatenar valores ya validados directamente
  const [rows] = await db.query(
    `SELECT 
            p.provider_id,
            p.workname,
            p.description,
            p.base_price,
            p.Latitude,
            p.Longitude,
            p.Time_Available,
            p.IMAGE,
            p.created_at,
            u.username,
            u.email,
            u.Foto as user_photo,
            st.type_name as service_type
        FROM providers p
        INNER JOIN users u ON p.user_id = u.user_id
        INNER JOIN ServiceType st ON p.Service_Type = st.id
        ORDER BY p.created_at DESC
        LIMIT ${safePageSize} OFFSET ${offset}`
  );

  return {
    data: rows,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total: total,
      totalPages: Math.ceil(total / safePageSize),
      hasNextPage: safePage < Math.ceil(total / safePageSize),
      hasPrevPage: safePage > 1,
    },
  };
}

/**
 * Obtener un servicio específico por ID con toda la información del proveedor
 * Incluye Time_Available parseado
 */
export async function getServiceById(serviceId) {
  const db = await getPrimaryPool();

  console.log(`Fetching service by ID: ${serviceId}`);

  const [rows] = await db.query(
    `SELECT 
      p.provider_id,
      p.user_id,
      p.workname,
      p.description,
      p.base_price,
      p.Latitude,
      p.Longitude,
      p.Time_Available,
      p.IMAGE,
      p.created_at,
      u.username,
      u.email,
      u.Foto as user_photo,
      st.id as service_type_id,
      st.type_name as service_type
    FROM providers p
    INNER JOIN users u ON p.user_id = u.user_id
    INNER JOIN ServiceType st ON p.Service_Type = st.id
    WHERE p.provider_id = ?`,
    [serviceId]
  );

  if (rows.length === 0) {
    return null;
  }

  const service = rows[0];

  // Parsear Time_Available si existe y es string
  if (service.Time_Available) {
    try {
      // Si es string, parsearlo a objeto
      if (typeof service.Time_Available === "string") {
        service.Time_Available = JSON.parse(service.Time_Available);
      }
      // Si ya es objeto, dejarlo como está
    } catch (error) {
      console.error("Error parsing Time_Available:", error);
      service.Time_Available = null;
    }
  }

  return service;
}
