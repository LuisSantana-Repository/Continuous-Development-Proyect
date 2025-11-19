import { getPrimaryPool } from "../config/database.js";
import { getS3SignedUrl } from "./storage.js";
import { getS3ImageAsBase64 } from "../utils/imageConverter.js";
import e from "express";

export async function getUserProfile(userId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    "SELECT user_id, email, username, provider, Foto, address, created_at FROM users WHERE user_id = ? LIMIT 1",
    [userId]
  );

  if (!rows.length) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = rows[0];
  console.log("User photo key from DB:", user.Foto);

  // Solo convertir a base64 si Foto no es null
  if (user.Foto) {
    console.log("Converting photo to base64");
    user.Foto = await getS3ImageAsBase64(user.Foto);
  } else {
    console.log("No photo found, returning null");
    user.Foto = null;
  }

  if (user.provider) {
    user.work = await getProviderWork(userId);
  }

  return user;
}

export async function getProviderWork(userId) {
  const db = await getPrimaryPool();
  const [rows] = await db.execute(
    `SELECT workname, description, base_price, Service_Type, Job_Permit, address, Time_Available 
     FROM providers WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (!rows.length) return null;

  const work = rows[0];
  work.Job_Permit = await getS3SignedUrl(work.Job_Permit);
  return work;
}

export async function updateUserProfile(userId, updates) {
  const db = await getPrimaryPool();
  const allowedFields = ["username", "email", "address", "Foto"];

  const fields = [];
  const values = [];

  // Verificar si el email ya existe (si se está actualizando)
  if (updates.email) {
    const [existingUser] = await db.execute(
      "SELECT user_id FROM users WHERE email = ? AND user_id != ? LIMIT 1",
      [updates.email.toLowerCase(), userId]
    );

    if (existingUser.length > 0) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }
  }

  // Si hay una foto nueva, subirla a S3
  if (updates.Foto) {
    const { uploadToS3 } = await import("./storage.js");
    const { PROFILE_PREFIX } = await import("../utils/constants.js");

    const fotoKey = await uploadToS3(PROFILE_PREFIX, updates.Foto);
    updates.Foto = fotoKey;
  }

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      // Normalizar email a minúsculas
      values.push(key === "email" ? value.toLowerCase() : value);
    }
  }

  if (fields.length === 0) {
    throw new Error("NO_VALID_FIELDS");
  }

  values.push(userId);

  await db.execute(
    `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`,
    values
  );

  return getUserProfile(userId);
}

export async function deleteUser(userId) {
  const db = await getPrimaryPool();

  // Delete from providers if exists
  await db.execute("DELETE FROM providers WHERE user_id = ?", [userId]);

  // Delete user
  const [result] = await db.execute("DELETE FROM users WHERE user_id = ?", [
    userId,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  return true;
}
