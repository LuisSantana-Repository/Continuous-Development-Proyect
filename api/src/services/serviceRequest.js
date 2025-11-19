import { v4 as uuid } from "uuid";
import { getPrimaryPool } from "../config/database.js";
import { getOrCreateChatForRequest, getUserChats } from "./chat.js";

/**
 * Convierte una fecha ISO 8601 a formato MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
 * @param {string} isoDate - Fecha en formato ISO 8601 (ej: "2025-11-20T17:00:00.000Z")
 * @returns {string} Fecha en formato MySQL
 */
function toMySQLDatetime(isoDate) {
  const date = new Date(isoDate);

  // Obtener componentes de fecha y hora
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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

  // Convertir fecha ISO a formato MySQL
  const mysqlDate = toMySQLDatetime(preferredDate);

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
      mysqlDate,
      address,
      contactPhone,
      amount,
    ]
  );

  try {
    const chat = await getOrCreateChatForRequest(userId, providerId, requestId);
    console.log(
      `Chat created/retrieved for request ${requestId}: ${chat.chat_id}`
    );

    return {
      requestId,
      chatId: chat.chat_id, // Return chat ID as well
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
    FROM service_requests sr
    WHERE sr.user_id = ?
  `;

  // Query base para datos - INCLUIR JOIN con providers y users para obtener el nombre del proveedor
  // También incluir información de reviews y reports del usuario
  let dataQuery = `
    SELECT 
      sr.request_id,
      sr.provider_id,
      sr.user_id,
      sr.status,
      sr.description,
      sr.preferred_date,
      sr.address,
      sr.contact_phone,
      sr.amount,
      sr.payment_status,
      sr.completed_at,
      sr.created_at,
      sr.updated_at,
      p.workname as provider_workname,
      u.username as provider_username,
      u.email as provider_email,
      st.type_name as service_type,
      ur.review_id,
      ur.rating as review_rating,
      ur.comment as review_comment,
      IF(urep.report_id IS NOT NULL, 1, 0) as has_user_report,
      IF(prep.review_id IS NOT NULL, 1, 0) as has_provider_review
    FROM service_requests sr
    INNER JOIN providers p ON sr.provider_id = p.provider_id
    INNER JOIN users u ON p.user_id = u.user_id
    LEFT JOIN ServiceType st ON p.Service_Type = st.id
    LEFT JOIN user_reviews ur ON sr.request_id = ur.service_request_id AND sr.user_id = ur.user_id
    LEFT JOIN user_reports urep ON sr.request_id = urep.service_request_id AND sr.user_id = urep.user_id
    LEFT JOIN provider_reviews prep ON sr.request_id = prep.service_request_id
    WHERE sr.user_id = ?
  `;

  const params = [userId];

  // Filtro opcional por status
  if (status) {
    countQuery += " AND sr.status = ?";
    dataQuery += " AND sr.status = ?";
    params.push(status);
  }

  // Obtener total
  const [countResult] = await db.execute(countQuery, params);
  const total = countResult[0].total;

  // Obtener datos paginados
  // SOLUCIÓN: Usar query() en lugar de execute() para LIMIT/OFFSET
  dataQuery += ` ORDER BY sr.created_at DESC LIMIT ${safePageSize} OFFSET ${offset}`;
  const [rows] = await db.query(dataQuery, params);

  // Obtener chatId para cada solicitud
  const requestsWithChat = await Promise.all(
    rows.map(async (row) => {
      try {
        // Obtener o crear el chat para esta solicitud específica
        const chat = await getOrCreateChatForRequest(
          userId,
          row.provider_id,
          row.request_id
        );
        return {
          ...row,
          chat_id: chat.chat_id, // Agregar chatId a la respuesta
        };
      } catch (error) {
        console.error(
          `Error getting chat for request ${row.request_id}:`,
          error
        );
        return {
          ...row,
          chat_id: null,
        };
      }
    })
  );

  return {
    data: requestsWithChat,
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
    FROM service_requests sr
    WHERE sr.provider_id = ?
  `;

  // Query base para datos - INCLUIR JOIN con users para obtener información del cliente
  // También incluir información de provider reviews y provider reports
  let dataQuery = `
    SELECT 
      sr.request_id,
      sr.provider_id,
      sr.user_id,
      sr.status,
      sr.description,
      sr.preferred_date,
      sr.address,
      sr.contact_phone,
      sr.amount,
      sr.payment_status,
      sr.completed_at,
      sr.created_at,
      sr.updated_at,
      u.username as client_username,
      u.email as client_email,
      u.Foto as client_photo,
      IF(prev.review_id IS NOT NULL, 1, 0) as has_provider_review,
      IF(prep.report_id IS NOT NULL, 1, 0) as has_provider_report
    FROM service_requests sr
    INNER JOIN users u ON sr.user_id = u.user_id
    LEFT JOIN provider_reviews prev ON sr.request_id = prev.service_request_id
    LEFT JOIN provider_reports prep ON sr.request_id = prep.service_request_id
    WHERE sr.provider_id = ?
  `;

  const params = [providerId];

  // Filtro opcional por status
  if (status) {
    countQuery += " AND sr.status = ?";
    dataQuery += " AND sr.status = ?";
    params.push(status);
  }

  // Obtener total
  const [countResult] = await db.execute(countQuery, params);
  const total = countResult[0].total;

  // Obtener datos paginados
  // SOLUCIÓN: Usar query() en lugar de execute() para LIMIT/OFFSET
  dataQuery += ` ORDER BY sr.created_at DESC LIMIT ${safePageSize} OFFSET ${offset}`;
  const [rows] = await db.query(dataQuery, params);

  // Obtener chatId para cada solicitud
  const requestsWithChat = await Promise.all(
    rows.map(async (row) => {
      try {
        // Obtener o crear el chat para esta solicitud específica
        const chat = await getOrCreateChatForRequest(
          row.user_id,
          providerId,
          row.request_id
        );
        return {
          ...row,
          chat_id: chat.chat_id, // Agregar chatId a la respuesta
        };
      } catch (error) {
        console.error(
          `Error getting chat for request ${row.request_id}:`,
          error
        );
        return {
          ...row,
          chat_id: null,
        };
      }
    })
  );

  return {
    data: requestsWithChat,
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

  // ✅ Si se está marcando como pagado, automáticamente cambiar status a in_progress
  if (updates.payment_status === "paid" && !updates.status) {
    fields.push(`status = ?`);
    values.push("in_progress");
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
