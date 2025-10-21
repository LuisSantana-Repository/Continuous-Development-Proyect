import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";

const sm = new SecretsManagerClient({});
let cachedSecret;   
let pool;             

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET;
const PROFILE_PREFIX = "profile/"; 
const INE_PREFIX = "INE/";
const WORK_PERMIT = "Work_permit/";

async function getDbConfig() {
  return {
    host: "mysql-rds-hot.cd28y48wmxoz.mx-central-1.rds.amazonaws.com",
    user: "admin",
    password: "3deAsada.",
    database: "my-sql-rds-hot",
    port: 3306
  };
}

async function getPool() {
  if (!pool) {
    const cfg = await getDbConfig();
    pool = mysql.createPool({
      ...cfg,
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true
    });
  }
  return pool;
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Add CORS if needed
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    },
    body: JSON.stringify(data)
  };
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

async function register(body) {
  const { 
    email, password, username, INE, provider, Foto, 
    Latitude, Longitude, work 
  } = body || {};
  
  if (!email || !password || !username || !INE || provider === undefined || !Foto || !Latitude || !Longitude) {
    return json(400, { error: "all required fields must be provided" });
  }

  if (provider && !work) {
    return json(400, { error: "work data required for provider accounts" });
  }

  // Validate work data if provider
  let workData = null;
  if (provider && work) {
    const { 
      workname, description, base_price, Service_Type, 
      Job_Permit, Latitude: workLat, Longitude: workLng, Time_Available 
    } = work;
    
    if (!workname || !description || !base_price || !Service_Type || 
        !Job_Permit || !workLat || !workLng || !Time_Available) {
      return json(400, { error: "all work fields required for provider accounts" });
    }
    
    workData = work;
  }

  const hash = await bcrypt.hash(password, 12);
  const db = await getPool();
  const user_id = uuid();

  try {
    // Upload files to S3
    const ineKey = await uploadToS3(INE_PREFIX, INE.data, INE.contentType);
    const fotoKey = await uploadToS3(PROFILE_PREFIX, Foto.data, Foto.contentType);

    // Insert user
    await db.execute(
      `INSERT INTO users (user_id, email, password_hash, username, INE, provider, Foto, Latitude, Longitude) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, email.toLowerCase(), hash, username, ineKey, provider, fotoKey, Latitude, Longitude]
    );

    // Insert provider data if applicable
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

    return json(201, { token, token_type: "Bearer", expires_in: 86400 });

  } catch (e) {
    if (e && e.code === "ER_DUP_ENTRY") {
      return json(409, { error: "email already registered" });
    }
    console.error("Register error:", e);
    return json(500, { error: "server error" });
  }
}

async function login(body) {
  const { email, password } = body || {};
  if (!email || !password) {
    return json(400, { error: "email and password are required" });
  }

  const db = await getPool();
  const [rows] = await db.execute(
    "SELECT user_id, email, password_hash, provider FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase()]
  );
  
  if (!rows.length) {
    return json(401, { error: "invalid credentials" });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return json(401, { error: "invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.user_id, provider: user.provider },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "24h" }
  );
  
  return json(200, { token, token_type: "Bearer", expires_in: 86400 });
}

async function getProviderWork(user_id) {
  const db = await getPool();
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

async function getMyData(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user_id = payload.sub;
    const db = await getPool();
    
    const [rows] = await db.execute(
      "SELECT user_id, email, username, provider, Foto, Latitude, Longitude FROM users WHERE user_id = ? LIMIT 1",
      [user_id]
    );
    
    if (!rows.length) {
      return json(404, { error: "user not found" });
    }
    
    const user = rows[0];
    user.Foto = await getS3ObjectSignedUrl(user.Foto);
    
    if (user.provider) {
      user.work = await getProviderWork(user_id);
    }
    
    return json(200, { user });
  } catch (error) {
    console.error("Token verification error:", error);
    return json(401, { error: "invalid token" });
  }
}

// Parse event body helper
function parseBody(event) {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

// Main handler
export const handler = async (event) => {
  try {
    // Support both HTTP API (v2) and REST API formats
    const method = event?.requestContext?.http?.method || event?.httpMethod || "GET";
    const path = event?.requestContext?.http?.path || event?.path || "/";
    const body = parseBody(event);

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return json(200, {});
    }

    // Route handling
    if (method === "POST" && path === "/register") {
      return await register(body);
    }
    
    if (method === "POST" && path === "/login") {
      return await login(body);
    }
    
    if (method === "GET" && path === "/me") {
      const auth = event.headers?.authorization || event.headers?.Authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      
      if (!token) {
        return json(401, { error: "missing token" });
      }
      
      return await getMyData(token);
    }

    return json(404, { error: "not found" });
    
  } catch (e) {
    console.error("Unhandled error:", e);
    return json(500, { error: "server error", message: e.message });
  }
};