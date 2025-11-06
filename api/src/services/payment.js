import { v4 as uuid } from "uuid";
import { getPrimaryPool, getSecondaryPool } from "../config/database.js";

    const hotDb = await getPrimaryPool();
    const db = await getSecondaryPool();

/**
 * Crear un nuevo pago
 */
export async function createPayment(data) {
    const { requestId, cardDetails } = data;

    const [rows] = await hotDb.execute(
        "SELECT request_id, amount FROM service_requests WHERE request_id = ?",
        [requestId]
    );

    if (!rows.length) {
        throw new Error("SERVICE_REQUEST_NOT_FOUND");
    }

    const paymentId = uuid();

    // Insertar pago
    await db.execute(
        `INSERT INTO payment (payment_id, request_id, date, amount, cardDetails) 
        VALUES (?, ?, ?, ?, ?)`,
        [paymentId, requestId, new Date(), rows[0].amount, cardDetails]
    );

    return { paymentId };
}

/**
 * Obtener un pago por ID
 */
export async function getPaymentById(request_id) {

  const [rows] = await db.execute(
    `SELECT 
      payment_id,
      request_id,
      date,
      amount,
      cardDetails
     FROM payment
     WHERE request_id = ?`,
    [request_id]
  );
  console.log(request_id);
  console.log(rows);

  if (!rows.length) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  return rows[0];
}

