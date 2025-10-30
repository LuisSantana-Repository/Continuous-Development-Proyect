import { getPrimaryPool } from "../config/database.js";
import { getS3SignedUrl } from "./storage.js";

export async function getUserProfile(userId) {
  const db = await getPrimaryPool();
  
  const [rows] = await db.execute(
    "SELECT user_id, email, username, provider, Foto, Latitude, Longitude FROM users WHERE user_id = ? LIMIT 1",
    [userId]
  );
  
  if (!rows.length) {
    throw new Error("USER_NOT_FOUND");
  }
  
  const user = rows[0];
  user.Foto = await getS3SignedUrl(user.Foto);
  
  if (user.provider) {
    user.work = await getProviderWork(userId);
  }
  
  return user;
}

export async function getProviderWork(userId) {
  const db = await getPrimaryPool();
  const [rows] = await db.execute(
    `SELECT workname, description, base_price, Service_Type, Job_Permit, 
            Latitude, Longitude, Time_Available 
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
  const allowedFields = ['username', 'Latitude', 'Longitude'];
  
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (fields.length === 0) {
    throw new Error("NO_VALID_FIELDS");
  }
  
  values.push(userId);
  
  await db.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );
  
  return getUserProfile(userId);
}

export async function deleteUser(userId) {
  const db = await getPrimaryPool();
  
  // Delete from providers if exists
  await db.execute("DELETE FROM providers WHERE user_id = ?", [userId]);
  
  // Delete user
  const [result] = await db.execute("DELETE FROM users WHERE user_id = ?", [userId]);
  
  if (result.affectedRows === 0) {
    throw new Error("USER_NOT_FOUND");
  }
  
  return true;
}