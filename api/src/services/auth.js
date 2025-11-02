import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { getPrimaryPool } from "../config/database.js";
import { uploadToS3 } from "./storage.js";
import { generateToken } from "../utils/jwt.js";
import { INE_PREFIX, PROFILE_PREFIX, WORK_PERMIT } from "../utils/constants.js";

export async function registerUser(userData) {
    const { email, password, username, INE, provider, Foto, Latitude, Longitude, work } = userData;

    const hash = await bcrypt.hash(password, 12);
    const db = await getPrimaryPool();
    const user_id = uuid();

    console.log("Uploading INE and Foto to S3");



    const ineKey = await uploadToS3(INE_PREFIX, INE);
    const fotoKey = await uploadToS3(PROFILE_PREFIX, Foto);

    await db.execute(
        `INSERT INTO users (user_id, email, password_hash, username, INE, provider, Foto, Latitude, Longitude) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, email.toLowerCase(), hash, username, ineKey, provider, fotoKey, Latitude, Longitude]
    );

    if (provider && work) {
        const jobPermitKey = await uploadToS3(WORK_PERMIT, work.Job_Permit.data, work.Job_Permit.contentType);
        await db.execute(
            `INSERT INTO providers (user_id, workname, description, base_price, Service_Type, Job_Permit, Latitude, Longitude, Time_Available) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, work.workname, work.description, work.base_price, work.Service_Type,
                jobPermitKey, work.Latitude, work.Longitude, JSON.stringify(work.Time_Available)]
        );
    }

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