// ./api/server.js
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make pools available to routes
app.locals.getPrimaryPool = getPrimaryPool;
app.locals.getSecondaryPool = getSecondaryPool;


// ==================== AWS CONFIG ====================
// Detecta si es desarrollo local o producción
const isLocal = process.env.NODE_ENV === 'development';

const awsConfig = isLocal 
  ? {
      endpoint: process.env.AWS_ENDPOINT || "http://localhost:4566",
      region: process.env.AWS_REGION || "mx-central-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test"
      },
      forcePathStyle: true  // Necesario para LocalStack
    }
  : { 
      region: process.env.AWS_REGION || "mx-central-1"
      // En producción usa credenciales IAM automáticamente
    };

const s3 = new S3Client(awsConfig);
const dynamodb = new DynamoDBClient(awsConfig);

const BUCKET = process.env.S3_BUCKET || "local-bucket";
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "sessions";
const PROFILE_PREFIX = "profile/";
const INE_PREFIX = "INE/";
const WORK_PERMIT = "Work_permit/";

// ==================== DATABASE POOLS ====================
let poolPrimary;   // RDS Principal (usuarios, proveedores)
let poolSecondary; // RDS Secundario (analytics, logs)

async function getPrimaryPool() {
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

async function getSecondaryPool() {
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

// ==================== HELPER FUNCTIONS ====================

// Log de actividad en BD secundaria
async function logActivity(userId, action, resource = null, req = null) {
  try {
    const dbSecondary = await getSecondaryPool();
    await dbSecondary.execute(
      `INSERT INTO activity_logs (user_id, action, resource, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId, 
        action, 
        resource,
        req?.ip || req?.headers['x-forwarded-for'] || 'unknown',
        req?.headers['user-agent'] || 'unknown'
      ]
    );
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Guardar sesión en DynamoDB
async function saveSession(userId, sessionData) {
  try {
    await dynamodb.send(new PutItemCommand({
      TableName: DYNAMODB_TABLE,
      Item: {
        userId: { S: userId },
        data: { S: JSON.stringify(sessionData) },
        timestamp: { N: Date.now().toString() },
        expiresAt: { N: (Date.now() + 86400000).toString() } // 24 horas
      }
    }));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

// Obtener sesión de DynamoDB
async function getSession(userId) {
  try {
    const result = await dynamodb.send(new GetItemCommand({
      TableName: DYNAMODB_TABLE,
      Key: { userId: { S: userId } }
    }));
    
    if (!result.Item) return null;
    
    const expiresAt = parseInt(result.Item.expiresAt.N);
    if (Date.now() > expiresAt) return null;
    
    return JSON.parse(result.Item.data.S);
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

async function uploadToS3(prefix, base64Data, contentType) {
  try {
    const buffer = Buffer.from(base64Data, "base64");
    const key = `${prefix}${uuid()}`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return key;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload file");
  }
}

async function getS3ObjectSignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
}

async function getProviderWork(user_id) {
  const db = await getPrimaryPool();
  const [rows] = await db.execute(
    `SELECT workname, description, base_price, Service_Type, Job_Permit, 
            Latitude, Longitude, Time_Available 
     FROM providers WHERE user_id = ? LIMIT 1`,
    [user_id]
  );
  
  if (!rows.length) return null;
  
  const work = rows[0];
  work.Job_Permit = await getS3ObjectSignedUrl(work.Job_Permit);
  return work;
}

// ==================== ROUTES ====================

 //  Health check
 app.get('/health', async (req, res) => {
   const checks = {
     timestamp: new Date().toISOString(),
     status: "healthy",
     checks: {}
   };
   // Check Database
   try {
     const db = await getPrimaryPool();
     await db.execute("SELECT 1 as ping");
     checks.checks.database = { status: "ok", message: "Connected" };
   } catch (error) {
     checks.status = "unhealthy";
     checks.checks.database = { status: "error", message: error.message };
   }

   // check Database Secondary
    try {
      const dbSecondary = await getSecondaryPool();
      await dbSecondary.execute("SELECT 1 as ping");
      checks.checks.database_secondary = { status: "ok", message: "Connected" };
    } catch (error) {
      checks.status = "unhealthy";
      checks.checks.database_secondary = { status: "error", message: error.message };
    }

   // Check S3
   try {
     await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: "test" }));
     checks.checks.s3 = { status: "ok", message: "Accessible" };
   } catch (error) {
     if (error.name === 'NoSuchKey') {
       checks.checks.s3 = { status: "ok", message: "Accessible" };
     } else {
       checks.checks.s3 = { status: "warning", message: error.message };
     }
   }

   // Check DynamoDB
    try {
      await dynamodb.send(new GetItemCommand({ TableName: DYNAMODB_TABLE, Key: { userId: { S: "healthcheck" } } }));
      checks.checks.dynamodb = { status: "ok", message: "Accessible" };
    } catch (error) {
      checks.checks.dynamodb = { status: "warning", message: error.message };
    }


   const statusCode = checks.status === "healthy" ? 200 : 503;
   res.status(statusCode).json(checks);
 });

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { 
      email, password, username, INE, provider, Foto, 
      Latitude, Longitude, work 
    } = req.body;
    
    if (!email || !password || !username || !INE || provider === undefined || !Foto || !Latitude || !Longitude) {
      return res.status(400).json({ error: "all required fields must be provided" });
    }

    if (provider && !work) {
      return res.status(400).json({ error: "work data required for provider accounts" });
    }

    let workData = null;
    if (provider && work) {
      const { 
        workname, description, base_price, Service_Type, 
        Job_Permit, Latitude: workLat, Longitude: workLng, Time_Available 
      } = work;
      
      if (!workname || !description || !base_price || !Service_Type || 
          !Job_Permit || !workLat || !workLng || !Time_Available) {
        return res.status(400).json({ error: "all work fields required for provider accounts" });
      }
      
      workData = work;
    }

    const hash = await bcrypt.hash(password, 12);
    const db = await getPrimaryPool();
    const user_id = uuid();

    const ineKey = await uploadToS3(INE_PREFIX, INE.data, INE.contentType);
    const fotoKey = await uploadToS3(PROFILE_PREFIX, Foto.data, Foto.contentType);

    await db.execute(
      `INSERT INTO users (user_id, email, password_hash, username, INE, provider, Foto, Latitude, Longitude) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, email.toLowerCase(), hash, username, ineKey, provider, fotoKey, Latitude, Longitude]
    );

    if (provider && workData) {
      const jobPermitKey = await uploadToS3(WORK_PERMIT, workData.Job_Permit.data, workData.Job_Permit.contentType);
      await db.execute(
        `INSERT INTO providers (user_id, workname, description, base_price, Service_Type, Job_Permit, Latitude, Longitude, Time_Available) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, workData.workname, workData.description, workData.base_price, 
          workData.Service_Type, jobPermitKey, workData.Latitude, workData.Longitude, 
          JSON.stringify(workData.Time_Available)
        ]
      );
    }

    const token = jwt.sign(
      { sub: user_id, provider: provider },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "24h" }
    );

    res.status(201).json({ token, token_type: "Bearer", expires_in: 86400 });

  } catch (e) {
    if (e && e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "email already registered" });
    }
    console.error("Register error:", e);
    res.status(500).json({ error: "server error" });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const db = await getPrimaryPool();
    const [rows] = await db.execute(
      "SELECT user_id, email, password_hash, provider FROM users WHERE email = ? LIMIT 1",
      [email.toLowerCase()]
    );
    
    if (!rows.length) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.user_id, provider: user.provider },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "24h" }
    );
    
    res.status(200).json({ token, token_type: "Bearer", expires_in: 86400 });

  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "server error" });
  }
});

// Get user data endpoint
app.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: "missing token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user_id = payload.sub;
    const db = await getPrimaryPool();
    
    const [rows] = await db.execute(
      "SELECT user_id, email, username, provider, Foto, Latitude, Longitude FROM users WHERE user_id = ? LIMIT 1",
      [user_id]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: "user not found" });
    }
    
    const user = rows[0];
    user.Foto = await getS3ObjectSignedUrl(user.Foto);
    
    if (user.provider) {
      user.work = await getProviderWork(user_id);
    }
    
    res.status(200).json({ user });

  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "invalid token" });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ message: "Welcome to the API server!" });
});





import { router as healthRouter } from './src/routes/health.js';
app.use('/health2', healthRouter);


//IMPORTANTE DEJAR AL FINAL
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});
// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`☁️  S3 Endpoint: ${process.env.AWS_ENDPOINT}`);
  //connsole log root
  console.log(`🌐 API Root: http://localhost:${PORT}/`);
});



