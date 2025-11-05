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
  // Obtener datos paginados
  const [rows] = await db.query(
    "SELECT id, type_name FROM ServiceType LIMIT ? OFFSET ?",
    [Number(safePageSize), Number(offset)]
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
        LIMIT ? OFFSET ?`,
    [Number(safePageSize), Number(offset)]
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
