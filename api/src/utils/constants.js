export const BUCKET = process.env.S3_BUCKET || "local-bucket";
export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "sessions";

export const PROFILE_PREFIX = "profile/";
export const INE_PREFIX = "INE/";
export const WORK_PERMIT = "Work_permit/";

export const TOKEN_EXPIRY = 86400; // 24 hours in seconds
export const SESSION_EXPIRY = 86400000; // 24 hours in milliseconds