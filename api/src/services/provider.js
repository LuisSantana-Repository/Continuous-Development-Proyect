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
      p.address,
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
      p.address,
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

/**
 * Actualizar perfil del proveedor
 * Permite actualizar: workname, email (del usuario), y Foto (del usuario)
 */
export async function updateProviderProfile(providerId, userId, updates) {
  const db = await getPrimaryPool();

  // Verificar que el proveedor pertenece al usuario
  const provider = await getProviderById(providerId);
  if (provider.user_id !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  // Separar actualizaciones para la tabla providers y users
  const providerUpdates = {};
  const userUpdates = {};

  if (updates.workname !== undefined) {
    providerUpdates.workname = updates.workname;
  }

  if (updates.email !== undefined) {
    // Verificar si el email ya existe (para otro usuario)
    const [existingUser] = await db.execute(
      "SELECT user_id FROM users WHERE email = ? AND user_id != ? LIMIT 1",
      [updates.email.toLowerCase(), userId]
    );

    if (existingUser.length > 0) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    userUpdates.email = updates.email.toLowerCase();
  }

  if (updates.Foto !== undefined) {
    // Si hay una foto nueva, subirla a S3
    const { uploadToS3 } = await import("./storage.js");
    const { PROFILE_PREFIX } = await import("../utils/constants.js");

    const fotoKey = await uploadToS3(PROFILE_PREFIX, updates.Foto);
    userUpdates.Foto = fotoKey;
  }

  // Actualizar tabla providers si hay cambios
  if (Object.keys(providerUpdates).length > 0) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(providerUpdates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    values.push(providerId);

    await db.execute(
      `UPDATE providers SET ${fields.join(", ")} WHERE provider_id = ?`,
      values
    );
  }

  // Actualizar tabla users si hay cambios
  if (Object.keys(userUpdates).length > 0) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(userUpdates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    values.push(userId);

    await db.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`,
      values
    );
  }

  // Retornar el proveedor actualizado
  const updatedProvider = await getProviderById(providerId);

  // Convertir imagen a base64 si existe
  if (updatedProvider.user_photo) {
    const { getS3ImageAsBase64 } = await import("../utils/imageConverter.js");
    updatedProvider.user_photo = await getS3ImageAsBase64(
      updatedProvider.user_photo
    );
  }

  return {
    success: true,
    provider: updatedProvider,
  };
}
