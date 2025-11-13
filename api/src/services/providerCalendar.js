import { getPrimaryPool } from "../config/database.js";

/**
 * Obtiene los datos del calendario para un proveedor en un mes específico
 * @param {number} providerId - ID del proveedor
 * @param {string} month - Mes en formato YYYY-MM
 * @returns {Promise<Object>} Datos del calendario
 */
export async function getProviderCalendar(providerId, month) {
  try {
    const pool = await getPrimaryPool();

    // 1. Obtener Time_Available del proveedor
    const [providerRows] = await pool.query(
      "SELECT Time_Available FROM providers WHERE provider_id = ?",
      [providerId]
    );

    if (providerRows.length === 0) {
      throw new Error("Proveedor no encontrado");
    }

    const timeAvailable = providerRows[0].Time_Available;

    // 2. Calcular rango de fechas del mes
    const year = month.split("-")[0];
    const monthNum = month.split("-")[1];
    const startDate = `${year}-${monthNum}-01 00:00:00`;
    const endDate = `${year}-${monthNum}-${getLastDayOfMonth(
      year,
      monthNum
    )} 23:59:59`;

    // 3. Obtener service requests en ese rango con estados específicos
    const [requests] = await pool.query(
      `SELECT 
        sr.request_id,
        sr.preferred_date,
        sr.status,
        sr.address,
        sr.contact_phone,
        sr.description,
        u.username as client_name,
        p.workname as service_name,
        p.Service_Type as service_type
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id = u.user_id
      LEFT JOIN providers p ON sr.provider_id = p.provider_id
      WHERE sr.provider_id = ?
        AND sr.preferred_date BETWEEN ? AND ?
        AND sr.status IN ('pending', 'accepted', 'in_progress')
      ORDER BY sr.preferred_date ASC`,
      [providerId, startDate, endDate]
    );

    // 4. Transformar requests a eventos del calendario
    const events = requests.map((req) => {
      const preferredDate = new Date(req.preferred_date);
      const dateStr = preferredDate.toISOString().split("T")[0];
      const startTime = preferredDate.toTimeString().slice(0, 5); // HH:MM

      // Calcular hora de fin (2 horas después por defecto)
      const endDate = new Date(preferredDate);
      endDate.setHours(endDate.getHours() + 2);
      const endTime = endDate.toTimeString().slice(0, 5);

      return {
        id: req.request_id.toString(),
        type: "service_request",
        date: dateStr,
        startTime: startTime,
        endTime: endTime,
        clientName: req.client_name || "Cliente",
        serviceName: req.service_name || req.service_type || "Servicio",
        status: req.status,
        address: req.address,
        phone: req.contact_phone,
        description: req.description,
      };
    });

    // 5. Calcular resumen
    const summary = {
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
      acceptedRequests: requests.filter((r) => r.status === "accepted").length,
      inProgressRequests: requests.filter((r) => r.status === "in_progress")
        .length,
    };

    return {
      providerId,
      month,
      timeAvailable,
      events,
      summary,
    };
  } catch (error) {
    console.error("Error en getProviderCalendar:", error);
    throw error;
  }
}

/**
 * Obtiene el último día del mes
 * @param {string} year - Año
 * @param {string} month - Mes (01-12)
 * @returns {number} Último día del mes
 */
function getLastDayOfMonth(year, month) {
  // Crear fecha del primer día del siguiente mes y restar un día
  const date = new Date(parseInt(year), parseInt(month), 0);
  return date.getDate();
}
