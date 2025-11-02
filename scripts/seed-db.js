import mysql from 'mysql2/promise';

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'admin',
    password: '3deAsada.',
    database: 'my-sql-rds-hot'
  });

  console.log('📊 Poblando base de datos...');

  // Insertar usuarios de prueba
  await connection.execute(`
    INSERT INTO users (user_id, email, password_hash, username, provider, Latitude, Longitude)
    VALUES 
      ('user-1', 'test1@example.com', '$2a$12$hash', 'Usuario 1', false, 20.6737, -103.4054),
      ('user-2', 'test2@example.com', '$2a$12$hash', 'Usuario 2', false, 20.6800, -103.4100)
    ON DUPLICATE KEY UPDATE email=email
  `);


  console.log('✅ Base de datos poblada');
  await connection.end();
}

seed().catch(console.error);
