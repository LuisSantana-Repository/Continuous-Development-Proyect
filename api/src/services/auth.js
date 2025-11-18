import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { getPrimaryPool } from "../config/database.js";
import { uploadToS3 } from "./storage.js";
import { generateToken } from "../utils/jwt.js";
import {
  INE_PREFIX,
  PROFILE_PREFIX,
  WORK_PERMIT,
  SERVICE_IMAGES_PREFIX,
} from "../utils/constants.js";

export async function registerUser(userData) {
  const { email, password, username, INE, provider, Foto, address, work } =
    userData;

  const hash = await bcrypt.hash(password, 12);
  const db = await getPrimaryPool();
  const user_id = uuid();
  console.log("Uploading INE to S3");
  const ineKey = await uploadToS3(INE_PREFIX, INE);

  // Foto es opcional, si no se proporciona guardamos null
  let fotoKey = null;
  if (Foto) {
    console.log("Uploading Foto to S3");
    fotoKey = await uploadToS3(PROFILE_PREFIX, Foto);
  }

  await db.execute(
    `INSERT INTO users (user_id, email, password_hash, username, INE, provider, Foto, address) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      email.toLowerCase(),
      hash,
      username,
      ineKey,
      provider,
      fotoKey,
      address.trim(),
    ]
  );

  if (provider && work) {
    // Se asume que `work` fue validado antes; aquí sólo normalizamos
    // `validateRegister` / `validateProviderWork` garantizan que work.address
    // exista y sea un string no vacío, por lo que aquí usamos trim() directamente
    // para evitar insertar NULL en la columna address de providers.
    const workAddress = work.address.trim();
    const jobPermitKey = await uploadToS3(
      WORK_PERMIT,
      work.Job_Permit.data,
      work.Job_Permit.contentType
    );

    // Subir la primera imagen del servicio (principal)
    let serviceImageKey = null;
    if (work.Images && work.Images.length > 0) {
      console.log(`Uploading ${work.Images.length} service image(s) to S3`);
      // Por ahora solo guardamos la primera imagen en la columna IMAGE
      // En el futuro se puede crear una tabla separada para múltiples imágenes
      serviceImageKey = await uploadToS3(SERVICE_IMAGES_PREFIX, work.Images[0]);
    }

    await db.execute(
      `INSERT INTO providers (user_id, workname, description, base_price, Service_Type, Job_Permit, IMAGE, address, Time_Available) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        work.workname,
        work.description,
        work.base_price,
        work.Service_Type,
        jobPermitKey,
        serviceImageKey,
        workAddress,
        JSON.stringify(work.Time_Available),
      ]
    );
  }
  console.log(`User registered with ID: ${user_id}`);
  const token = generateToken(user_id, provider);
  return { token, token_type: "Bearer", expires_in: 86400 };
}

export async function loginUser(email, password) {
  const db = await getPrimaryPool();
  const [rows] = await db.execute(
    "SELECT user_id, email, password_hash, provider FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase()]
  );

  if (!rows.length) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = generateToken(user.user_id, user.provider);
  return { token, token_type: "Bearer", expires_in: 86400 };
}
