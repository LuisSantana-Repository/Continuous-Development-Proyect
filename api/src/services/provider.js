import { getPrimaryPool } from "../config/database.js";

/**
 * Obtener proveedores por user_id
 */
export async function getProviderByUserId(userId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      p.provider_id,
      p.user_id,
      p.workname,
      p.description,
      p.base_price,
      p.Service_Type,
      p.Job_Permit,
      p.IMAGE,
      p.Latitude,
      p.Longitude,
      p.Time_Available,
      p.created_at,
      p.updated_at,
      st.type_name as service_type_name
     FROM providers p
     LEFT JOIN ServiceType st ON p.Service_Type = st.id
     WHERE p.user_id = ?`,
    [userId]
  );

  return rows;
}

/**
 * Obtener un proveedor por provider_id
 */
export async function getProviderById(providerId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      p.provider_id,
      p.user_id,
      p.workname,
      p.description,
      p.base_price,
      p.Service_Type,
      p.Job_Permit,
      p.IMAGE,
      p.Latitude,
      p.Longitude,
      p.Time_Available,
      p.created_at,
      p.updated_at,
      st.type_name as service_type_name,
      u.username,
      u.email,
      u.Foto as user_photo
     FROM providers p
     LEFT JOIN ServiceType st ON p.Service_Type = st.id
     LEFT JOIN users u ON p.user_id = u.user_id
     WHERE p.provider_id = ?`,
    [providerId]
  );

  if (rows.length === 0) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  return rows[0];
}
