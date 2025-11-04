
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
    
    console.log(`Fetching services - Page: ${safePage}, Page Size: ${safePageSize}, Offset: ${offset}, Total: ${total}`);
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
            hasPrevPage: safePage > 1
        }
    };
}