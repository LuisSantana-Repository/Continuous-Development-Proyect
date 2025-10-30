import mysql from "mysql2/promise";


// ==================== DATABASE POOLS ====================
let poolPrimary, poolSecondary;

export async function getPrimaryPool() {
    if (!poolPrimary) {
        poolPrimary = mysql.createPool({
            host: process.env.DB_PRIMARY_HOST || "localhost",
            user: process.env.DB_PRIMARY_USER || "admin",
            password: process.env.DB_PRIMARY_PASSWORD || "3deAsada.",
            database: process.env.DB_PRIMARY_NAME || "my-sql-rds-hot",
            port: process.env.DB_PRIMARY_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            enableKeepAlive: true
        });
    }
    return poolPrimary;
}

export async function getSecondaryPool() {
    if (!poolSecondary) {
        poolSecondary = mysql.createPool({
            host: process.env.DB_SECONDARY_HOST || "localhost",
            user: process.env.DB_SECONDARY_USER || "admin",
            password: process.env.DB_SECONDARY_PASSWORD || "3deAsada.",
            database: process.env.DB_SECONDARY_NAME || "analytics_db",
            port: process.env.DB_SECONDARY_PORT || 3307,
            waitForConnections: true,
            connectionLimit: 10,
            enableKeepAlive: true
        });
    }
    return poolSecondary;
}