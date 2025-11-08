import { v4 as uuid } from "uuid";
import { getPrimaryPool } from "../config/database.js";
import { getOrCreateChat } from "./chat.js";

/**
 * Crear una nueva solicitud de servicio
 */
export async function createServiceRequest(data) {
  const {
    providerId,
    userId,
    description,
    preferredDate,
    address,
    contactPhone,
    amount,
  } = data;

  const db = await getPrimaryPool();
  const requestId = uuid();

  // Verificar que el proveedor existe
  const [provider] = await db.execute(
    "SELECT provider_id FROM providers WHERE provider_id = ?",
    [providerId]
  );

  if (!provider.length) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  // Insertar solicitud
  await db.execute(
    `INSERT INTO service_requests 
     (request_id, provider_id, user_id, status, description, 
      preferred_date, address, contact_phone, amount, payment_status) 
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, 'pending')`,
    [
      requestId,
      providerId,
      userId,
      description,
      preferredDate,
      address,
      contactPhone,
      amount,
    ]
  );

  try {
    const chat = await getOrCreateChat(userId, providerId);
    console.log(`Chat created/retrieved for request ${requestId}: ${chat.chat_id}`);
    
    return { 
      requestId,
      chatId: chat.chat_id // Return chat ID as well
    };
  } catch (chatError) {
    // Si falla la creación del chat, loguear pero no fallar la solicitud
    console.error("Error creating chat for service request:", chatError);
    return { requestId, chatId: null };
  }

}

/**
 * Obtener una solicitud específica por ID
 */
export async function getServiceRequestById(requestId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      request_id,
      provider_id,
      user_id,
      status,
      description,
      preferred_date,
      address,
      contact_phone,
      amount,
      payment_status,
      completed_at,
      created_at,
      updated_at
     FROM service_requests 
     WHERE request_id = ?`,
    [requestId]
  );

  if (!rows.length) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  return rows[0];
}

/**
 * Obtener solicitudes de un usuario (cliente)
 */
export async function getUserServiceRequests(
  userId,
  page = 1,
  pageSize = 10,
  status = null
) {
  const db = await getPrimaryPool();
  const safePage = Math.max(1, parseInt(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;

  // Query base para contar
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM service_requests 
    WHERE user_id = ?
  `;

  // Query base para datos
  let dataQuery = `
    SELECT 
      request_id,
      provider_id,
      user_id,
      status,
      description,
      preferred_date,
      address,
      contact_phone,
      amount,
      payment_status,
      completed_at,
      created_at,
      updated_at
    FROM service_requests 
    WHERE user_id = ?
  `;

  const params = [userId];

  // Filtro opcional por status
  if (status) {
    countQuery += " AND status = ?";
    dataQuery += " AND status = ?";
    params.push(status);
  }

  // Obtener total
  const [countResult] = await db.execute(countQuery, params);
  const total = countResult[0].total;

  // Obtener datos paginados
  dataQuery += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  const dataParams = [...params, safePageSize, offset];
  const [rows] = await db.execute(dataQuery, dataParams);

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
 * Obtener solicitudes de un proveedor
 */
export async function getProviderServiceRequests(
  providerId,
  page = 1,
  pageSize = 10,
  status = null
) {
  const db = await getPrimaryPool();
  const safePage = Math.max(1, parseInt(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;

  // Query base para contar
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM service_requests 
    WHERE provider_id = ?
  `;

  // Query base para datos
  let dataQuery = `
    SELECT 
      request_id,
      provider_id,
      user_id,
      status,
      description,
      preferred_date,
      address,
      contact_phone,
      amount,
      payment_status,
      completed_at,
      created_at,
      updated_at
    FROM service_requests 
    WHERE provider_id = ?
  `;

  const params = [providerId];

  // Filtro opcional por status
  if (status) {
    countQuery += " AND status = ?";
    dataQuery += " AND status = ?";
    params.push(status);
  }

  // Obtener total
  const [countResult] = await db.execute(countQuery, params);
  const total = countResult[0].total;

  // Obtener datos paginados
  dataQuery += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  const dataParams = [...params, safePageSize, offset];
  const [rows] = await db.execute(dataQuery, dataParams);

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
 * Actualizar el estado de una solicitud
 */
export async function updateServiceRequestStatus(requestId, updates) {
  const db = await getPrimaryPool();

  const allowedFields = ["status", "payment_status", "completed_at", "amount"];

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new Error("NO_VALID_FIELDS");
  }

  values.push(requestId);

  const [result] = await db.execute(
    `UPDATE service_requests SET ${fields.join(", ")} WHERE request_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  return getServiceRequestById(requestId);
}

/**
 * Cancelar/eliminar una solicitud (soft delete mediante status)
 */
export async function cancelServiceRequest(requestId) {
  const db = await getPrimaryPool();

  const [result] = await db.execute(
    "UPDATE service_requests SET status = 'cancelled' WHERE request_id = ?",
    [requestId]
  );

  if (result.affectedRows === 0) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  return { success: true };
}

export async function updatePaymentStatus(data) {
  const { requestId, paymentStatus } = data;
  const db = await getPrimaryPool();

  const [result] = await db.execute(
    "UPDATE service_requests SET payment_status = ? WHERE request_id = ?",
    [paymentStatus, requestId]
  );

  if (result.affectedRows === 0) {
    throw new Error("REQUEST_NOT_FOUND");
  }
  updateStatus({ requestId, status: "in_progress" });
  return { success: true };
}

export async function updateStatus(data) {
  const { requestId, status } = data;
  const db = await getPrimaryPool();
  const [result] = await db.execute(
    "UPDATE service_requests SET status = ? WHERE request_id = ?",
    [status, requestId]
  );

  if (result.affectedRows === 0) {
    throw new Error("REQUEST_NOT_FOUND");
  }
  return { success: true };
}
